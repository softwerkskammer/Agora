'use strict';

var async = require('async');
var _ = require('lodash');
var conf = require('nconf');
var beans = conf.get('beans');

var validation = beans.get('validation');
var Member = beans.get('member');
var Group = beans.get('group');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var wikiService = beans.get('wikiService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var activitiesService = beans.get('activitiesService');
var activitystore = beans.get('activitystore');
var misc = beans.get('misc');
var statusmessage = beans.get('statusmessage');
var notifications = beans.get('notifications');

function memberForNew(req) {
  return new Member().initFromSessionUser(req.user);
}

function saveMember(persistentMember, req, res, next) {
  if (persistentMember && !res.locals.accessrights.canEditMember(persistentMember)) {
    return res.redirect('/members');
  }
  var member = persistentMember || memberForNew(req);
  var oldEmail = persistentMember ? member.email() : req.body.previousEmail;
  member.addAuthentication(req.body.id);
  member.fillFromUI(req.body);
  memberstore.saveMember(member, function (err) {
    if (err) { return next(err); }
    if (!req.user.member || req.user.member.id() === member.id()) {
      req.user.member = member;
      delete req.user.profile;
    }
    var subscriptions = misc.toArray(req.body.newSubscriptions);
    if (!persistentMember) { // new member
      // must be done here, not in Service to avoid circular deps
      notifications.newMemberRegistered(member, subscriptions);
    }
    return groupsAndMembersService.updateSubscriptions(member, oldEmail, subscriptions, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.members.saved').putIntoSession(req);
      return res.redirect('/members/' + encodeURIComponent(member.nickname()));
    });
  });
}

function memberSubmitted(req, res, next) {
  groupsAndMembersService.getUserWithHisGroups(req.body.previousNickname, function (err, member) {
    if (err) { return next(err); }
    saveMember(member, req, res, next);
  });
}

var app = misc.expressAppIn(__dirname);

app.get('/', function (req, res, next) {
  memberstore.allMembers(function (err, members) {
    if (err) { return next(err); }
    async.each(members, membersService.getImage, function (err) {
      if (err) { return next(err); }
      res.render('index', { members: members, wordList: membersService.toWordList(members) });
    });
  });
});

app.get('/interests/:interest', function (req, res, next) {
  memberstore.getMembersWithInterest(req.params.interest, function (err, members) {
    if (err) { return next(err); }
    async.each(members, membersService.getImage, function (err) {
      if (err) { return next(err); }
      res.render('index', { members: members, wordList: membersService.toWordList(members) });
    });
  });
});


app.get('/checknickname', function (req, res) {
  misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname, res.end);
});

app.get('/checkemail', function (req, res) {
  misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail, res.end);
});

app.get('/new', function (req, res, next) {
  if (req.user.member) {
    return res.redirect('/members/');
  }
  async.parallel(
    { allGroups: function (callback) { groupsService.getAllAvailableGroups(callback); },
      alle: function (callback) { groupstore.getGroup('alle', callback); },
      commercial: function (callback) { groupstore.getGroup('commercial', callback); } },
    function (err, results) {
      if (err) { return next(err); }
      var groups = results.allGroups;
      var regionalGroups = groupsService.combineSubscribedAndAvailableGroups([results.alle, results.commercial], Group.regionalsFrom(groups));
      var thematicGroups = groupsService.combineSubscribedAndAvailableGroups([results.alle, results.commercial], Group.thematicsFrom(groups));
      res.render('edit', { member: memberForNew(req), regionalgroups: regionalGroups, themegroups: thematicGroups});
    }
  );
});

app.get('/edit/:nickname', function (req, res, next) {
  async.parallel(
    { member: function (callback) { groupsAndMembersService.getUserWithHisGroups(req.params.nickname, callback); },
      allGroups: function (callback) { groupsService.getAllAvailableGroups(callback); },
      allMembers: function (callback) { memberstore.allMembers(callback); } },
    function (err, results) {
      if (err) { return next(err); }
      var member = results.member;
      if (err || !member) { return next(err); }
      if (!res.locals.accessrights.canEditMember(member)) {
        return res.redirect('/members/' + encodeURIComponent(member.nickname()));
      }
      var allGroups = results.allGroups;
      var tags = _(membersService.toWordList(results.allMembers)).pluck('text').sortBy().value();
      var regionalGroups = groupsService.combineSubscribedAndAvailableGroups(member.subscribedGroups, Group.regionalsFrom(allGroups));
      var thematicGroups = groupsService.combineSubscribedAndAvailableGroups(member.subscribedGroups, Group.thematicsFrom(allGroups));
      res.render('edit', { member: member, regionalgroups: regionalGroups, themegroups: thematicGroups, tags: tags});
    }
  );
});

app.get('/delete/:nickname', function (req, res, next) {
  var nicknameOfEditMember = req.params.nickname;
  groupsAndMembersService.getUserWithHisGroups(nicknameOfEditMember, function (err, member) {
    if (err || !member) { return next(err); }
    if (!res.locals.accessrights.canDeleteMember(member)) {
      return res.redirect('/members/' + encodeURIComponent(member.nickname()));
    }
    if (_.isEmpty(member.subscribedGroups)) {
      return memberstore.removeMember(member, function (err) {
        if (err) { return next(err); }
        statusmessage.successMessage('message.title.save_successful', 'message.content.members.deleted').putIntoSession(req);
        res.redirect('/members/');
      });
    }
    statusmessage.errorMessage('message.title.problem', 'message.content.members.hasSubscriptions').putIntoSession(req);
    res.redirect('/members/edit/' + encodeURIComponent(member.nickname()));
  });
});

app.post('/submit', function (req, res, next) {
  async.parallel(
    [
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (nickname, callback) { membersService.isValidNickname(nickname, callback); };
        validation.checkValidity(req.body.previousNickname, req.body.nickname, validityChecker, req.i18n.t('validation.nickname_not_available'), callback);
      },
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (email, callback) { membersService.isValidEmail(email, callback); };
        validation.checkValidity(req.body.previousEmail, req.body.email, validityChecker, req.i18n.t('validation.duplicate_email'), callback);
      },
      function (callback) {
        var errors = validation.isValidForMember(req.body);
        callback(null, errors);
      }
    ],
    function (err, errorMessages) {
      var realErrors = _.filter(_.flatten(errorMessages), function (message) { return !!message; });
      if (realErrors.length === 0) {
        return memberSubmitted(req, res, next);
      }
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
  );
});

app.get('/:nickname', function (req, res, next) {
  groupsAndMembersService.getUserWithHisGroups(req.params.nickname, function (err, member, subscribedGroups) {
    if (err || !member) { return next(err); }
    activitiesService.getPastActivitiesOfMember(member, function (err, activities) {
      if (err) { return next(err); }
      res.render('get', { member: member, pastActivities: activities, subscribedGroups: subscribedGroups });
    });
  });
});

module.exports = app;
