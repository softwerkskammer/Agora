"use strict";
var should = require('chai').should();
var request = require('request');
var port = 17125;

var app = require('../lib/app.js');
var base_uri = "http://localhost:" + port;
var events_uri = base_uri + '/events';

describe('SWK Plattform server', function () {
  beforeEach(function (done) {
    app.start(port, done);
  });

  afterEach(function (done) {
    app.stop(done);
  });

  it('should respond on a GET for the home page', function (done) {
    request({uri: base_uri}, function (req, resp) {
      should.exist(resp);
      resp.statusCode.should.equal(200);
      done();
    });
  });

  it('should show "Softwerkskammer" on the home page', function (done) {
    request({uri: base_uri}, function (req, resp) {
      resp.body.should.contain('Softwerkskammer');
      done();
    });
  });

  it('should show "Upcoming events" on the event page', function (done) {
    request({uri: events_uri}, function (req, resp) {
      resp.body.should.contain('Upcoming events');
      done();
    });
  });

  it('should show "Event X" for GET /events/X', function (done) {
    request({uri: events_uri + '/X'}, function (req, resp) {
      resp.body.should.contain('Event X');
      done();
    });
  });
});
