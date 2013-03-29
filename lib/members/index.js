"use strict";
var Member = require('./member');
var express = require('express');
var app = module.exports = express();
var path = require('path');
var store = require('./store');
var groups = require('../groups/index');
var async = require('async');

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
app.set('views', path.join(__dirname, '/views'));

app.set('view engine', 'jade');

app.get('/', function (req, res) {
  store.allMembers(function (err, members) {
    res.render('index', { members: members });
  });
});

app.get('/edit/:nickname', function (req, res) {
  store.getMember(req.params.nickname, function (err, member) {
    res.render('edit', { member: member ? member : new Member()});
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

app.get('/:nickname', function (req, res) {
  async.waterfall([
    function (callback) {
      store.getMember(req.params.nickname, callback);
    },
    function (member, callback) {
      groups.getSubscribedListsForUser(member.email, async.apply(callback, member));
    }
  ],
    // callback for all results
    function (member, err, subscribedLists) {
      res.render('get', { member: member, subscribed: subscribedLists });
    }
  );
});



