/*global describe, beforeEach, it */
"use strict";
var request = require('supertest'),
    proxy = require('proxyquire'),
    express = require('express');

var storeProxy = {
  getEvents: function () { return []; },
};
var events = proxy('../lib/events', { './store': storeProxy });

describe('Events application', function () {
  var app;

  beforeEach(function () {
    app = events(express());
    app.locals.baseUrl = 'events';
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
    storeProxy.getEvent = function () {
      return { id: 'X', title: 'XYZ' };
    };
    request(app)
      .get('/X')
      .expect('Content-Type', /text\/html/)
      .expect(200)
      .expect(/<html>/)
      .expect(/XYZ/, done);
  });

  it('shows "Upcoming events" on the main page', function (done) {
    storeProxy.getEvents = function () {
      return [
        { id: 'foo', title: 'FooFoo' },
        { id: 'bar', title: 'Bar baz' }
      ];
    };
    request(app)
      .get('/')
      .expect(200)
      .expect(/Upcoming events/)
      .expect(/FooFoo/)
      .expect(/Bar baz/, done);
  });

  it('constructs correct links to an event', function (done) {
    storeProxy.getEvents = function () {
      return [
        { id: 'foo', title: 'FooFoo' },
      ];
    };
    request(app)
      .get('/')
      .expect(200)
      .expect(/href="events\/foo"/, done);
  });
});

