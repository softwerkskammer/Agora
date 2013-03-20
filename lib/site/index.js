"use strict";

var siteApp = require('express')();

siteApp.get('/', function (req, res) {
  res.render('index', { title: 'Hallo Softwerkskammer! :-)' });
});

module.exports = siteApp;
