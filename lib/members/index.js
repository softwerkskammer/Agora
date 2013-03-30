"use strict";

var path = require('path');

module.exports = function (app, conf) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var Member = require('./member');
  var store = require('./memberstore')(conf);
  var groups = require('../groups/internalAPI')(conf);
  var async = require('async');

  function memberSubmitted(req, res, next) {
    var member = new Member().fromObject(req.body);
    if (member.isValid()) {
      store.saveMember(member, function (err) {
        if (err) {
          return next(err);
        }
        res.render('get', {member: member, subscribedLists: []});
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
    async.waterfall([
      function (callback) {
        store.getMember(req.params.nickname, callback);
      },
      function (member, callback) {
        groups.getSubscribedListsForUser(member.email, async.apply(callback, member));
      }
    ],
    // callback for results of last function
    function (member, err, subscribedLists) {
      var validLists = subscribedLists.filter(function (list) {
        return list !== undefined;
      });
      if (validLists.length === 0) {
        validLists = [];
      }
      res.render('get', { member: member, subscribedLists: validLists });
    });
  });


  return app;
};
