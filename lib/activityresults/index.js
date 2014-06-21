'use strict';
var beans = require('nconf').get('beans');
var misc = beans.get('misc');

var app = misc.expressAppIn(__dirname);
var logger = require('winston').loggers.get('application');

app.get('/', function (req, res) {
  res.render('index');
});

module.exports = app;
