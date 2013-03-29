"use strict";
var Member = require('./member');
var express = require('express');
var app = module.exports = express();
var path = require('path');
var store = require('./store');

function memberSubmitted(req, res) {
  var member = new Member().fromObject(req.body);
  if (member.isValid()) {
    store.saveMember(member, function (err) {
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

app.post('/submit', function (req, res) {
  memberSubmitted(req, res);
});
app.post('/edit/submit', function (req, res) {
  memberSubmitted(req, res);
});

app.get('/:nickname', function (req, res) {
  store.getMember(req.params.nickname, function (err, member) {
    res.render('get', { member: member });
  });
});



