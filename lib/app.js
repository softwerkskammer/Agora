"use strict";

var express = require('express');
var http = require('http');
var gruppenverwaltung = require('./gruppenverwaltung');

var app = express();
require('./site').addProvider(app, '/');
require('./events').addProvider(app, '/events');
app.use('/gruppenverwaltung', gruppenverwaltung);

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
