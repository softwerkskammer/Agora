"use strict";

var path = require('path');
var async = require('async');
var fs = require('fs');
var beans = require('nconf').get('beans');
var Renderer = beans.get('renderer');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembers = beans.get('groupsAndMembersAPI');
var Group = beans.get('group');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
app.locals.pretty = true;

app.get('/', function (req, res, next) {
  // display all groups
  groupsAPI.getAllAvailableGroups(function (err, groups) {
    if (err) { return next(err); }
    async.map(groups, function (group, callback) { groupsAndMembers.addMembercountToGroup(group, callback); },
      function (err, groupsWithMembers) {
        if (err) { return next(err); }
        res.render('index', {regionalgroups: Group.regionalsFrom(groupsWithMembers)});
      });
  });
});

app.get('/robots.txt', function (req, res, next) {
  fs.readFile(path.join(__dirname, 'views', 'robots.txt'), "utf8", function (err, data) {
    if (err) { return next(err); }
    res.send(data);
  });
});

app.get('/goodbye.html', function (req, res) {
  if (req.user && req.user.member) {
    res.redirect('/');
  }
  res.render('goodbye');
});

app.get('/impressum.html', function (req, res) {
  res.render('impressum');
});

app.get('/help.html', function (req, res) {
  res.render('help');
});

app.get('/credits.html', function (req, res) {
  res.render('credits');
});

app.get('/login', function (req, res) {
  res.render('authenticationRequired');
});

app.get('/mustBeSuperuser', function (req, res) {
  res.render('superuserRightsRequired', {requestedPage: req.query.page});
});

app.get('/cheatsheet.html', function (req, res) {
  res.render('lazyMarkdownCheatsheet');
});

app.get('/test', function (req, res) {
  res.render('../../../views/errorPages/authenticationError', {error: {stack: ""}});
});

app.get('/language/:isoCode', function (req, res) {
  req.session.language = req.params.isoCode;
  res.redirect(req.query.currentUrl);
});

app.post('/preview', function (req, res) {
  res.send(Renderer.render(req.body.data, req.body.subdir));
});

module.exports = app;
