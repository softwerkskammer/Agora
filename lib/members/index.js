"use strict";

var express = require('express');
var app = module.exports = express();
var path = require('path');
var store = require('./store');

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'jade');

app.get('/', function (req, res) {
  store.allMembers(function (members) {
    res.render('index', { members: members });
  });
});

app.get('/:nickname', function (req, res) {
  store.getMember(req.params.nickname, function (member) {
    res.render('get', { member: member });
  });
});

