'use strict';

var path = require('path');
var async = require('async');
var fs = require('fs');
var _ = require('lodash');

var beans = require('simple-configure').get('beans');
var Renderer = beans.get('renderer');
var misc = beans.get('misc');
var sponsorpairs = require('./sponsorpairs');

var app = misc.expressAppIn(__dirname);

app.get('/', function (req, res) {
  res.render('index', {sponsors: sponsorpairs()});
});

app.get('/goodbye.html', function (req, res) {
  if (req.user && req.user.member) {
    return res.redirect('/');
  }
  res.render('goodbye');
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

app.get('/sponsoring.html', function (req, res) {
  res.render('sponsoring');
});

app.post('/preview', function (req, res) {
  res.send(Renderer.render(req.body.data, req.body.subdir));
});

app.get('/login', function (req, res) {
  res.render('authenticationRequired');
});

app.get('/loginDialog', function (req, res) {
  res.render('loginDialog', {returnUrl: req.query.returnUrl});
});

app.get('/cheatsheet.html', function (req, res) {
  res.render('lazyMarkdownCheatsheet');
});

module.exports = app;
