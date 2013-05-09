"use strict";

var path = require('path');
var conf = require('nconf');
var async = require('async');

var validation = conf.get('beans').get('validation');
var Member = conf.get('beans').get('member');
var Group = conf.get('beans').get('group');
var api = conf.get('beans').get('membersAPI');
var groupsAndMembersAPI = conf.get('beans').get('groupsAndMembersAPI');
var groupsAPI = conf.get('beans').get('groupsAPI');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function memberForNew(req) {
    return new Member().initFromSessionUser(req.user);
  }

  function saveMember(memberOfRequest, previousMemberData, req, res, next) {
    api.saveMember(memberOfRequest, function (err, member) {
      if (err) {return next(err); }
      if (!req.user.member || req.user.member.id === member.id) {
        req.user.member = member;
      }

      var oldEmail = previousMemberData ? previousMemberData.email : member.email;
      return groupsAPI.updateSubscriptions(member.email, oldEmail, req.body.newSubscriptions, function (err) {
        if (err) { return next(err); }
        return res.redirect('/members/' + encodeURIComponent(member.nickname));
      });
    });
  }

  function memberSubmitted(req, res, next) {
    var memberOfRequest = new Member(req.body);
    var errors = validation.isValidMember(memberOfRequest);
    if (errors.length !== 0) {
      return res.render('../../../views/errorPages/validationError', {errors: errors});
    }
    return api.getMemberForId(memberOfRequest.id, function (err, member) {
      if (err) { return next(err); }
      saveMember(memberOfRequest, member, req, res, next);
    });
  }

  app.get('/', function (req, res, next) {
    api.allMembers(function (err, members) {
      if (err) { return next(err); }
      res.render('index', { members: members });
    });
  });

  app.get('/checknickname', function (req, res) {
    var nickname = req.query.nickname;
    var previousNickname = req.query.previousNickname;
    if (previousNickname === nickname) {
      return res.end('true');
    }
    api.isValidNickname(nickname, function (err, result) {
      if (err) { return res.end('false'); }
      res.end(result.toString());
    });
  });

  app.get('/new', function (req, res, next) {
    if (req.user.member) {
      return res.redirect('/members/');
    }
    async.parallel(
      { allGroups: function (callback) { groupsAPI.getAllAvailableGroups(callback); },
        alle: function (callback) { groupsAPI.getGroup('alle', callback); },
        commercial: function (callback) { groupsAPI.getGroup('commercial', callback); } },
      function (err, results) {
        if (err) { return next(err); }
        var groups = results.allGroups;
        var regionalGroups = groupsAPI.combineSubscribedAndAvailableGroups([results.alle, results.commercial], Group.regionalsFrom(groups));
        var thematicGroups = groupsAPI.combineSubscribedAndAvailableGroups([results.alle, results.commercial], Group.thematicsFrom(groups));
        res.render('edit', { member: memberForNew(req), regionalgroups: regionalGroups, themegroups: thematicGroups});
      });
  });

  app.get('/edit/:nickname', function (req, res, next) {
    var nicknameOfEditMember = req.params.nickname;
    groupsAndMembersAPI.getUserWithHisGroups(nicknameOfEditMember, function (err, member, subscribedGroups) {
      if (err) { return next(err); }
      groupsAPI.getAllAvailableGroups(function (err, allGroups) {
        if (err) { return next(err); }
        var groups = allGroups;
        var regionalGroups = groupsAPI.combineSubscribedAndAvailableGroups(subscribedGroups, Group.regionalsFrom(groups));
        var thematicGroups = groupsAPI.combineSubscribedAndAvailableGroups(subscribedGroups, Group.thematicsFrom(groups));
        res.render('edit', { member: member, regionalgroups: regionalGroups, themegroups: thematicGroups});
      });
    });
  });

  app.post('/submit', function (req, res, next) {
    var nickname = req.body.nickname;
    var previousNickname = req.body.previousNickname;
    if (nickname !== previousNickname) {
      return api.isValidNickname(nickname, function (err, check) {
        if (err || !check) {
          var errors = ['Dieseer Nickname ist leider nicht verfügbar.'];
          return res.render('../../../views/errorPages/validationError', {errors: errors});
        }
        memberSubmitted(req, res, next);
      });
    }
    memberSubmitted(req, res, next);
  });

  app.get('/:nickname', function (req, res, next) {
    var globalCallback = function (err, member, subscribedGroups) {
      if (err) { return next(err); }
      res.render('get', { member: member, subscribedGroups: subscribedGroups });
    };
    groupsAndMembersAPI.getUserWithHisGroups(req.params.nickname, globalCallback);
  });

  return app;
}
;
