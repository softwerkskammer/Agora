"use strict";

var path = require('path');

module.exports = function (app, conf) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var Member = require('./member');
  var api = require('./membersAPI')(conf);
  var store = require('./memberstore')(conf);
  var groupsAndMembers = require('../groupsAndMembers/groupsAndMembersAPI')(conf);

  function memberFromRequest(req) {
    return new Member().updateWith(req.body, req.user);
  }

  function memberSubmitted(req, res, next) {
    api.saveMember(memberFromRequest(req), function (err, member) {
      if (err) {
        return next(err);
      }
      if (member.isValid()) {
        return res.redirect('/members/' + memberFromRequest(req).nickname);
      }
      if (req.user.registered) {
        return res.redirect('/members/edit');
      }
      res.redirect('/members/new');
    });
  }

  app.get('/', function (req, res, next) {
    store.allMembers(function (err, members) {
      var link = req.originalUrl.substring(1);
      link = /-*\/$/.test(link) ? '' : link + '/';
      if (err) {
        return next(err);
      }
      res.render('index', { members: members, link: link });
    });
  });

  app.get('/new', function (req, res) {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }
    res.render('edit', { member: memberFromRequest(req)});
  });

  app.get('/edit', function (req, res, next) {
    if (!req.isAuthenticated()) {
      return res.redirect('/auth/login');
    }
    store.getMemberForId(memberFromRequest(req).id, function (err, member) {
      if (err) {
        return next(err);
      }
      if (member) {
        return res.render('edit', { member: member});
      }
      res.redirect('/members/new');
    });
  });

  app.post('/submit', function (req, res, next) {
    memberSubmitted(req, res, next);
  });

  app.get('/:nickname', function (req, res) {
    var globalCallback = function (member, subscribedLists) {
      res.render('get', { member: member, subscribedGroups: subscribedLists });
    };

    groupsAndMembers.getUserWithHisGroups(req.params.nickname, globalCallback);
  });

  return app;
};
