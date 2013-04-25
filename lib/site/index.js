"use strict";

var siteApp = require('express')();
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
