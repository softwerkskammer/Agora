"use strict";

var path = require('path');
var siteApp = require('express')();
var fs = require('fs');

siteApp.set('views', path.join(__dirname, 'views'));
siteApp.locals({pretty: true});

siteApp.get('/', function (req, res) {
  res.render('index');
});

siteApp.get('/robots.txt', function (req, res) {
  res.send(fs.readFileSync(path.join(__dirname, 'views', 'robots.txt'), "utf8"));
});

siteApp.get('/goodbye.html', function (req, res) {
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

siteApp.get('/mustBeAdmin', function (req, res) {
  res.render('adminRightsRequired', {requestedPage: req.query.page});
});

module.exports = siteApp;
