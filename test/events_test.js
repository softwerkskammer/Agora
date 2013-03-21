"use strict";

var request = require('supertest'),
    express = require('express'),
    events = require('../lib/events');


describe('Events application', function () {
  var app;

  beforeEach(function () {
    app = events(express());
  });

  it('maps to a custom path', function (done) {
    var root = express();
    root.use('/foo', events(express()));
    request(root)
      .get('/foo')
      .expect('Content-Type', /text\/html/)
      .expect(200, done);
  });

  it('accepts a route with id', function (done) {
    request(app)
      .get('/X')
      .expect('Content-Type', /text\/html/)
      .expect(200)
      .expect(/<html>/)
      .expect(/Event/, done);
  });

  it('shows "Upcoming events" on the main page', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/Upcoming events/, done);
  });
});

