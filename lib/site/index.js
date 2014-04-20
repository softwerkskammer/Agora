"use strict";

var path = require('path');
var async = require('async');
var siteApp = require('express')();
var fs = require('fs');
var beans = require('nconf').get('beans');
var Renderer = beans.get('renderer');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembers = beans.get('groupsAndMembersAPI');
var Group = beans.get('group');

siteApp.set('views', path.join(__dirname, 'views'));
siteApp.locals.pretty = true;

siteApp.get('/', function (req, res, next) {
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

siteApp.get('/robots.txt', function (req, res, next) {
  fs.readFile(path.join(__dirname, 'views', 'robots.txt'), "utf8", function (err, data) {
    if (err) { return next(err); }
    res.send(data);
  });
});

siteApp.get('/goodbye.html', function (req, res) {
  if (req.user && req.user.member) {
    res.redirect('/');
  }
  res.render('goodbye');
});

siteApp.get('/impressum.html', function (req, res) {
  res.render('impressum');
});

siteApp.get('/help.html', function (req, res) {
  res.render('help');
});

siteApp.get('/credits.html', function (req, res) {
  res.render('credits');
});

siteApp.get('/login', function (req, res) {
  res.render('authenticationRequired');
});

siteApp.get('/mustBeSuperuser', function (req, res) {
  res.render('superuserRightsRequired', {requestedPage: req.query.page});
});

siteApp.get('/cheatsheet.html', function (req, res) {
  res.render('lazyMarkdownCheatsheet');
});

siteApp.get('/test', function (req, res) {
  res.render('../../../views/errorPages/authenticationError', {error: {stack: ""}});
});

siteApp.get('/language/:isoCode', function (req, res) {
  req.session.language = req.params.isoCode;
  res.redirect(req.query.currentUrl);
});

siteApp.post('/preview', function (req, res) {
  res.send(Renderer.render(req.body.data, req.body.subdir));
});

module.exports = siteApp;
