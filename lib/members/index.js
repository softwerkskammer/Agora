"use strict";

var path = require('path');

module.exports = function (app, conf) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var Member = require('./member');
  var api = require('./internalAPI')(conf);
  var store = require('./memberstore')(conf);
  var groupsAndMembers = require('../groupsAndMembers/internalAPI')(conf);

  function memberFromRequest(req) {
    var member = new Member().fromObject(req.body);
    member.id = req.user.identifier;
    return member;
  }

  function memberSubmitted(req, res, next) {
    api.saveMember(memberFromRequest(req), next, function(err, result) {
      if (err) {
        return next(err);
      }
      if (result) {
        res.render('get', {member: memberFromRequest(req), subscribedLists: []});
      } else {
        res.render('edit', { member: memberFromRequest(req)});
      }
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
    res.render('edit', { member: new Member(req.user.identifier)});
  });

  app.get('/edit', function (req, res) {
    res.render('edit', { member: new Member()});
  });

  app.post('/submit', function (req, res, next) {
    memberSubmitted(req, res, next);
  });

  app.post('/edit/submit', function (req, res, next) {
    memberSubmitted(req, res, next);
  });

  app.get('/edit/:nickname', function (req, res, next) {
    store.getMember(req.params.nickname, function (err, member) {
      if (err) {
        return next(err);
      }
      res.render('edit', { member: member ? member : new Member()});
    });
  });

  app.get('/:nickname', function (req, res) {
    var globalCallback = function (member, subscribedLists) {
      res.render('get', { member: member, subscribedLists: subscribedLists });
    };

    groupsAndMembers.getUserWithHisLists(req.params.nickname, globalCallback);
  });


  return app;
};
