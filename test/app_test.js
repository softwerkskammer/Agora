"use strict";
var should = require('chai').should();
var request = require('request');
var app = require('../app.js');

var port = 17125;

var base_uri = "http://localhost:" + port;

describe('SWK Plattform server', function () {
  beforeEach(function (done) {
    app.start(port, done);
  });

  afterEach(function (done) {
    app.stop(done);
  });

  it('responds on a GET for the home page', function (done) {
    request({uri: base_uri}, function (req, resp) {
      should.exist(resp);
      resp.statusCode.should.equal(200);
      done();
    });
  });

  it('responds with HTML on a GET for the home page', function (done) {
    request({uri: base_uri}, function (req, resp) {
      resp.headers['content-type'].should.contain('text/html');
      done();
    });
  });

  it('shows "Softwerkskammer" on the home page', function (done) {
    request({uri: base_uri}, function (req, resp) {
      resp.body.should.contain('Softwerkskammer');
      done();
    });
  });

  it('has events app', function (done) {
    request({uri: base_uri + '/events'}, function (req, res) {
      res.statusCode.should.equal(200);
      res.headers['content-type'].should.contain('text/html');
      res.body.should.contain('events');
      done();
    });
  });

  it('events app constructs correct links', function (done) {
    request({uri: base_uri + '/events'}, function (req, res) {
      res.body.should.contain('href="/events/1"');
      done();
    });
  });

  it('provides the style sheet', function (done) {
    var stylesheet_uri = base_uri + '/stylesheets/style.css';
    request({uri: stylesheet_uri}, function (req, resp) {
      resp.statusCode.should.equal(200);
      resp.headers['content-type'].should.contain('text/css');
      resp.body.should.contain('color:');
      done();
    });
  });
});
