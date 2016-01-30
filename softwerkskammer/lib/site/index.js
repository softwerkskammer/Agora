/* eslint no-underscore-dangle: 0 */
'use strict';

var path = require('path');
var async = require('async');
var fs = require('fs');
var qrimage = require('qr-image');
var _ = require('lodash');

var conf = require('simple-configure');
var beans = conf.get('beans');
var Renderer = beans.get('renderer');
var groupsService = beans.get('groupsService');
var groupsAndMembers = beans.get('groupsAndMembersService');
var Group = beans.get('group');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
app.locals.pretty = true;

app.get('/', function (req, res, next) {
  // display all groups
  groupsService.getAllAvailableGroups(function (err, groups) {
    if (err) { return next(err); }
    async.map(groups, function (group, callback) { groupsAndMembers.addMembercountToGroup(group, callback); },
      function (err1, groupsWithMembers) {
        if (err1) { return next(err1); }
        res.render('index', {regionalgroups: Group.regionalsFrom(groupsWithMembers)});
      });
  });
});

app.get('/robots.txt', function (req, res, next) {
  fs.readFile(path.join(__dirname, 'views', 'robots.txt'), 'utf8', function (err, data) {
    if (err) { return next(err); }
    res.send(data);
  });
});

app.get('/goodbye.html', function (req, res) {
  if (req.user && req.user.member) {
    return res.redirect('/');
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

app.get('/loginDialog', function (req, res) {
  res.render('loginDialog', {returnUrl: req.query.returnUrl});
});

app.get('/mustBeSuperuser', function (req, res) {
  res.render('superuserRightsRequired', {requestedPage: req.query.page});
});

app.get('/cheatsheet.html', function (req, res) {
  res.render('lazyMarkdownCheatsheet');
});

app.get('/test', function (req, res) {
  res.render('../../../views/errorPages/authenticationError', {error: {stack: ''}});
});

app.get('/language/:isoCode', function (req, res) {
  req.session.language = req.params.isoCode.substring(0, 2);
  res.redirect(req.query.currentUrl);
});

app.post('/preview', function (req, res) {
  res.send(Renderer.render(req.body.data, req.body.subdir));
});

app.get('/qrcode', function (req, res) {
  var url = req.query.url;
  var fullUrl = _.startsWith(url, 'http') ? url : conf.get('publicUrlPrefix') + url;
  var img = qrimage.image(fullUrl, {type: 'svg'});
  res.type('svg');
  img.pipe(res);
});

module.exports = app;
