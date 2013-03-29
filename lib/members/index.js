"use strict";

var path = require('path');
var Member = require('./member');
var store = require('./store');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function memberSubmitted(req, res, next) {
    var member = new Member().fromObject(req.body);
    if (member.isValid()) {
      store.saveMember(member, function (err) {
        if (err) {
          return next(err);
        }
        res.render('get', {member: member});
      });
    } else {
      res.render('edit', { member: member});
    }
  }

  app.get('/', function (req, res, next) {
    store.allMembers(function (err, members) {
      if (err) {
        return next(err);
      }
      res.render('index', { members: members });
    });
  });

  app.get('/edit', function (req, res) {
    res.render('edit', { member: new Member()});
  });

  app.post('/submit', function (req, res, next) {
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

  app.post('/edit/submit', function (req, res, next) {
    memberSubmitted(req, res, next);
  });

  app.get('/:nickname', function (req, res) {
    store.getMember(req.params.nickname, function (err, member) {
      res.render('get', { member: member });
    });
  });


  return app;
};
