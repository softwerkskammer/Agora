'use strict';

var path = require('path');
var async = require('async');
var fs = require('fs');
var beans = require('nconf').get('beans');
var Renderer = beans.get('renderer');
var groupsService = beans.get('groupsService');
var groupsAndMembers = beans.get('groupsAndMembersService');
var Group = beans.get('group');
var misc = beans.get('misc');
var sponsors = require('./sponsors.json');
var app = misc.expressAppIn(__dirname);
app.locals.pretty = true;

app.get('/', function (req, res, next) {
  res.render('index', {sponsors: sponsors});
});

app.get('/robots.txt', function (req, res, next) {
  fs.readFile(path.join(__dirname, 'views', 'robots.txt'), 'utf8', function (err, data) {
    if (err) { return next(err); }
    res.send(data);
  });
});

app.get('/impressum.html', function (req, res) {
  res.render('impressum');
});

app.get('/schedule.html', function (req, res) {
  res.render('schedule');
});

app.get('/location.html', function (req, res) {
  res.render('location');
});

app.get('/history.html', function (req, res) {
  res.render('history');
});

app.get('/values.html', function (req, res) {
  res.render('values');
});

app.get('/contact.html', function (req, res) {
  res.render('contact');
});

app.get('/sponsoring.html', function (req, res) {
  res.render('sponsoring');
});

module.exports = app;
