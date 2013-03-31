"use strict";

var siteApp = require('express')();

siteApp.get('/', function (req, res) {
  res.render('index', { title: 'Hallo ' + (req.user ? req.user.profile.displayName : 'Softwerkskammer!') + ' :-)' });
});

module.exports = siteApp;
