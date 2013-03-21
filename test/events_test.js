"use strict";

var request = require('supertest'),
    express = require('express'),
    events = require('../lib/events');


describe('Events application', function () {
  var app;

  beforeEach(function () {
    app = express();
    app.set('view engine', 'jade');
    app.use('/foo', events(express()));
  });

  it('is mapped to a custom path', function (done) {
    request(app)
      .get('/foo')
      .expect('Content-Type', /text\/html/)
      .expect(200)
      .expect(/<title>.*events.*<\/title>/, done);
  });

  it('accepts a route with id', function (done) {
    request(app)
      .get('/foo/X')
      .expect('Content-Type', /text\/html/)
      .expect(200)
      .expect(/<html>/)
      .expect(/Event X/, done);
  });
});

