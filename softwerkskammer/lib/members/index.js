'use strict';

var async = require('async');
var _ = require('lodash');
var Form = require('multiparty').Form;

var beans = require('simple-configure').get('beans');
var validation = beans.get('validation');
var Member = beans.get('member');
var Group = beans.get('group');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var activitiesService = beans.get('activitiesService');
var misc = beans.get('misc');
var statusmessage = beans.get('statusmessage');
var notifications = beans.get('notifications');

function memberSubmitted(req, res, next) {
  function notifyNewMemberRegistration(member, subscriptions) {
    // must be done here, not in Service to avoid circular deps
    notifications.newMemberRegistered(member, subscriptions);
  }

  groupsAndMembersService.updateAndSaveSubmittedMemberWithSubscriptions(req.user, req.body, res.locals.accessrights, notifyNewMemberRegistration, function (err, nickname) {
    if (err) { return next(err); }

    if (nickname) {
      statusmessage.successMessage('message.title.save_successful', 'message.content.members.saved').putIntoSession(req);
      return res.redirect('/members/' + encodeURIComponent(nickname));
    }

    return res.redirect('/members');
  });
}

function tagsFor(callback) {
  memberstore.allMembers(function (err, members) {
    callback(err, _(membersService.toWordList(members)).map('text').sortBy().value());
  });
}

var app = misc.expressAppIn(__dirname);

app.get('/', function (req, res, next) {
  memberstore.allMembers(function (err, members) {
    if (err) { return next(err); }
    async.each(members, membersService.putAvatarIntoMemberAndSave, function (err1) {
      if (err1) { return next(err1); }
      res.render('index', {members: members, wordList: membersService.toWordList(members)});
    });
  });
});

app.get('/interests', function (req, res, next) {
  var casesensitive = req.query.casesensitive ? '' : 'i';
  memberstore.getMembersWithInterest(req.query.interest, casesensitive, function (err, members) {
    if (err) { return next(err); }
    async.each(members, membersService.putAvatarIntoMemberAndSave, function (err1) {
      if (err1) { return next(err1); }
      res.render('indexForTag', {
        interest: req.query.interest,
        members: members,
        wordList: membersService.toWordList(members)
      });
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
    {
      allGroups: function (callback) { groupsService.getAllAvailableGroups(callback); },
      alle: function (callback) { groupstore.getGroup('alle', callback); },
      commercial: function (callback) { groupstore.getGroup('commercial', callback); },
      allTags: function (callback) { tagsFor(callback); }
    },
    function (err, results) {
      if (err) { return next(err); }
      var allGroups = results.allGroups;
      res.render('edit', {
        member: new Member().initFromSessionUser(req.user),
        regionalgroups: groupsService.combineSubscribedAndAvailableGroups([results.alle, results.commercial], Group.regionalsFrom(allGroups)),
        themegroups: groupsService.combineSubscribedAndAvailableGroups([results.alle, results.commercial], Group.thematicsFrom(allGroups)),
        tags: results.allTags
      });
    }
  );
});

app.get('/edit/:nickname', function (req, res, next) {
  async.parallel(
    {
      member: function (callback) { groupsAndMembersService.getMemberWithHisGroups(req.params.nickname, callback); },
      allGroups: function (callback) { groupsService.getAllAvailableGroups(callback); },
      allTags: function (callback) { return tagsFor(callback); }
    },
    function (err, results) {
      if (err) { return next(err); }
      var member = results.member;
      if (err || !member) { return next(err); }
      if (!res.locals.accessrights.canEditMember(member)) {
        return res.redirect('/members/' + encodeURIComponent(member.nickname()));
      }
      var allGroups = results.allGroups;
      res.render('edit', {
        member: member,
        regionalgroups: groupsService.combineSubscribedAndAvailableGroups(member.subscribedGroups, Group.regionalsFrom(allGroups)),
        themegroups: groupsService.combineSubscribedAndAvailableGroups(member.subscribedGroups, Group.thematicsFrom(allGroups)),
        tags: results.allTags
      });
    }
  );
});

app.post('/delete', function (req, res, next) {
  var nicknameOfEditMember = req.body.nickname;
  groupsAndMembersService.getMemberWithHisGroups(nicknameOfEditMember, function (err, member) {
    if (err || !member) { return next(err); }
    if (!res.locals.accessrights.canDeleteMember(member)) {
      return res.redirect('/members/' + encodeURIComponent(member.nickname()));
    }
    if (_.isEmpty(member.subscribedGroups)) {
      return memberstore.isSoCraTesSubscriber(member.id(), function(err1, isSubscriber) {
        if (!err && isSubscriber) {
          member.state.socratesOnly = true;
          return memberstore.saveMember(member, function (err2) {
            if (err2) { return next(err2); }
            statusmessage.successMessage('message.title.save_successful', 'message.content.members.saved').putIntoSession(req);
            res.redirect('/members/' + encodeURIComponent(member.nickname()));
          });
        }
        memberstore.removeMember(member, function (err2) {
          if (err2) { return next(err2); }
          statusmessage.successMessage('message.title.save_successful', 'message.content.members.deleted').putIntoSession(req);
          res.redirect('/members/');
        });
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
        var validityChecker = function (nickname, cb) { membersService.isValidNickname(nickname, cb); };
        validation.checkValidity(req.body.previousNickname, req.body.nickname, validityChecker, req.i18n.t('validation.nickname_not_available'), callback);
      },
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (email, cb) { membersService.isValidEmail(email, cb); };
        validation.checkValidity(req.body.previousEmail, req.body.email, validityChecker, req.i18n.t('validation.duplicate_email'), callback);
      },
      function (callback) {
        var errors = validation.isValidForMember(req.body);
        callback(null, errors);
      }
    ],
    function (err, errorMessages) {
      if (err) { return next(err); }
      var realErrors = _.filter(_.flatten(errorMessages), function (message) { return !!message; });
      if (realErrors.length === 0) {
        return memberSubmitted(req, res, next);
      }
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
  );
});

app.post('/submitavatar', function (req, res, next) {
  new Form().parse(req, function (err, fields, files) {
    var nickname = fields.nickname[0];
    if (err || !files || files.length < 1) {
      return res.redirect('/members/' + nickname);
    }
    var params = {
      geometry: fields.w[0] + 'x' + fields.h[0] + '+' + fields.x[0] + '+' + fields.y[0],
      scale: fields.scale[0],
      angle: fields.angle[0]
    };
    membersService.saveCustomAvatarForNickname(nickname, files, params, function (err1) {
      if (err1) { return next(err1); }
      res.redirect('/members/' + encodeURIComponent(nickname)); // Es fehlen Prüfungen im Frontend
    });
  });
});

app.post('/deleteAvatarFor', function (req, res, next) {
  var nicknameOfEditMember = req.body.nickname;
  memberstore.getMember(nicknameOfEditMember, function (err, member) {
    if (err) { return next(err); }
    if (res.locals.accessrights.canEditMember(member)) {
      return membersService.deleteCustomAvatarForNickname(nicknameOfEditMember, function (err1) {
        if (err1) { return next(err1); }
        res.redirect('/members/' + encodeURIComponent(nicknameOfEditMember));
      });
    }
    res.redirect('/members/' + encodeURIComponent(nicknameOfEditMember));
  });

});

app.get('/:nickname', function (req, res, next) {
  groupsAndMembersService.getMemberWithHisGroups(req.params.nickname, function (err, member, subscribedGroups) {
    if (err || !member) { return next(err); }
    activitiesService.getPastActivitiesOfMember(member, function (err1, activities) {
      if (err1) { return next(err1); }
      res.render('get', {member: member, pastActivities: activities, subscribedGroups: subscribedGroups});
    });
  });
});

module.exports = app;
