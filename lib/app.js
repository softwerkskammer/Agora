"use strict";

var app = require('express')();

app.use('/', require('./site'));
app.use('/events', require('./events'));
app.use('/gruppenverwaltung', require('./gruppenverwaltung'));

var http = require('http');
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
