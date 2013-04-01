"use strict";

var path = require('path');

module.exports = function (app, conf) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var Member = require('./member');
  var api = require('./internalAPI')(conf);
  var store = require('./memberstore')(conf);
  var groupsAndMembers = require('../groupsAndMembers/groupsAndMembersAPI')(conf);
  var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;

  function memberFromRequest(req) {
    return new Member().updateWith(req.body, req.user);
  }

  function memberSubmitted(req, res, next) {
    api.saveMember(memberFromRequest(req), function (err, member) {
      if (err) {
        return next(err);
      }
      if (member.isValid()) {
        req.user.registered = true;
        return res.redirect('/members/' + memberFromRequest(req).nickname);
      }
      if (req.user.registered) {
        return res.redirect('/members/edit');
      }
      res.redirect('/members/new');
    });
  }

  app.get('/', ensureLoggedIn('/auth/login'), function (req, res, next) {
    store.allMembers(function (err, members) {
      if (err) {
        return next(err);
      }
      res.render('index', { members: members });
    });
  });

  app.get('/new', ensureLoggedIn('/auth/login'), function (req, res) {
    if (req.user.registered) {
      return res.redirect('/members/edit');
    }
    res.render('edit', { member: memberFromRequest(req)});
  });

  app.get('/edit', ensureLoggedIn('/auth/login'), function (req, res, next) {
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
      res.render('get', { member: member, subscribedLists: subscribedLists });
    };

    groupsAndMembers.getUserWithHisGroups(req.params.nickname, globalCallback);
  });

  return app;
};
