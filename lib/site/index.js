"use strict";

var path = require('path');
var siteApp = require('express')();
siteApp.set('views', path.join(__dirname, 'views'));
siteApp.locals({
  pretty: true
});

siteApp.get('/', function (req, res) {
  res.render('index', { title: 'Hallo ' + (req.user ? req.user.profile.displayName : 'Softwerkskammer!') + ' :-)' });
});

siteApp.get('/impressum.html', function (req, res) {
  res.render('impressum');
});

module.exports = siteApp;
