"use strict";

var express = require('express');
var http = require('http');
var app = express();
require('./site').addProvider(app, '/');
require('./events').addProvider(app, '/events');

var server = http.createServer(app);

exports.start = function (port) {
  server.listen(port, function () {
    console.log('Server running at port ' + port);
  });
};

exports.stop = function () {
  server.close(function () {
    console.log('server stopped');
  });
};
