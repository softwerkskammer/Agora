"use strict";

var express = require('express');
var http = require('http');
var site = require('./site');
var events = require('./events');
var app = express();

app.use('/', site);
app.use('/events', events);

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
