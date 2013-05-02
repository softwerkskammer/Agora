"use strict";

var path = require('path');
var siteApp = require('express')();
siteApp.set('views', path.join(__dirname, 'views'));
siteApp.locals({
  pretty: true
});

siteApp.get('/', function (req, res) {
  res.render('index');
});

siteApp.get('/goodbye.html', function (req, res) {
  res.render('goodbye');
});

siteApp.get('/impressum.html', function (req, res) {
  res.render('impressum');
});

siteApp.get('/credits.html', function (req, res) {
  res.render('credits');
});

module.exports = siteApp;
