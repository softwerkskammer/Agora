"use strict";

var siteApp = require('express')();

siteApp.get('/', function (req, res) {
  res.send('Hallo Softwerkskammer! :-)');
});

module.exports = siteApp;
