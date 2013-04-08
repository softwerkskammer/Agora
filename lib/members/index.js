"use strict";

var path = require('path');

module.exports = function (app, conf) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var Member = require('./member');
  var api = require('./membersAPI')(conf);
  var groupsAndMembers = require('../groupsAndMembers/groupsAndMembersAPI')(conf);
  var groups = require('../groups/groupsAPI')(conf);
  var urlPrefix = conf.get('publicUrlPrefix');

  function memberFromRequest(req) {
    return new Member().updateWith(req.body, req.user);
  }

  function saveMember(memberOfRequest, req, res, next) {
    api.saveMember(memberOfRequest, function (err, member) {
      if (err) {
        return next(err);
      }
      if (member.isValid()) {
        req.user.registered = true;

        return groups.updateSubscriptions(member.email, req.body.newSubscriptions, function (err) {
          if (err) {
            return next(err);
          }
          return res.redirect(urlPrefix + '/members/' + member.nickname);
        });
      }
      if (req.user.registered) {
        return res.redirect(urlPrefix + '/members/edit');
      }
      res.redirect(urlPrefix + '/members/new');
    });
  }

  function memberSubmitted(req, res, next) {
    var memberOfRequest = memberFromRequest(req);
    if (req.user.registered) {
      return api.getMemberForId(memberFromRequest(req).id, function (err, member) {
        if (err) {
          return next(err);
        }
        memberOfRequest.nickname = member.nickname;
        saveMember(memberOfRequest, req, res, next);
      });
    }
    saveMember(memberOfRequest, req, res, next);
  }

  app.get('/', function (req, res, next) {
    api.allMembers(function (err, members) {
      if (err) {
        return next(err);
      }
      res.render('index', { members: members });
    });
  });

  app.get('/checknickname', function (req, res) {
    var nickname = req.query.nickname;
    api.isValidNickname(nickname, function (err, result) {
      if (err) {
        return 'false';
      }
      res.end(result.toString());
    });
  });

  app.get('/new', function (req, res, next) {
    if (req.user.registered) {
      return res.redirect('/members/edit');
    }
    groups.getAllAvailableGroups(function (err, allGroups) {
      if (err) {
        return next(err);
      }
      res.render('edit', { member: memberFromRequest(req), markedGroups: groups.combineSubscribedAndAvailableGroups([], allGroups) });
    });
  });

  app.get('/edit', function (req, res, next) {
    groupsAndMembers.getUserWithHisGroupsById(memberFromRequest(req).id, function (err, member, subscribedGroups) {
      if (err) {
        return next(err);
      }
      if (member) {
        return groups.getAllAvailableGroups(function (err, allGroups) {
          if (err) {
            return next(err);
          }
          return res.render('edit', { member: member, markedGroups: groups.combineSubscribedAndAvailableGroups(subscribedGroups, allGroups) });
        });
      }
      res.redirect('/members/new');
    });
  });

  app.post('/submit', function (req, res, next) {
    memberSubmitted(req, res, next);
  });

  app.get('/submit', function (req, res, next) {
    next('Not allowed');
  });

  app.get('/:nickname', function (req, res, next) {
    var globalCallback = function (err, member, subscribedGroups) {
      if (err) {
        return next(err);
      }
      res.render('get', { member: member, subscribedGroups: subscribedGroups });
    };

    groupsAndMembers.getUserWithHisGroups(req.params.nickname, globalCallback);
  });

  return app;
};
