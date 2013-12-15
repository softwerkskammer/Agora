"use strict";

var path = require('path');
var siteApp = require('express')();
var fs = require('fs');
var beans = require('nconf').get('beans');
var Renderer = beans.get('renderer');

siteApp.set('views', path.join(__dirname, 'views'));
siteApp.locals({pretty: true});

siteApp.get('/', function (req, res) {
  res.render('index');
});

siteApp.get('/robots.txt', function (req, res) {
  res.send(fs.readFileSync(path.join(__dirname, 'views', 'robots.txt'), "utf8"));
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

siteApp.get('/mustBeAdmin', function (req, res) {
  res.render('adminRightsRequired', {requestedPage: req.query.page});
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
  res.render('preview', {
    content: Renderer.render(req.body.data, req.body.subdir)
  });
});

module.exports = siteApp;
