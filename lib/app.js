"use strict";

var express = require('express');
var http = require('http');

var app = express();
require('./site').addProvider(app, '/');
require('./events').addProvider(app, '/events');
var gruppenverwaltung = require('./gruppenverwaltung');
gruppenverwaltung.addProvider(app, '/gruppenverwaltung');

var server = http.createServer(app);

exports.start = function (port, done) {
  server.listen(port, function () {
    console.log('Server running at port ' + port);
    if (done) {
      done();
    }
  });
};

exports.stop = function (done) {
  server.close(function () {
    console.log('server stopped');
    if (done) {
      done();
    }
  });
};
