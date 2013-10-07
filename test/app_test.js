"use strict";
var should = require('chai').should();
var httpRequest = require('request');
var conf = require('./configureForTest');

var base_uri = "http://localhost:" + parseInt(conf.get('port'), 10);

var app = require('../app.js');

describe('SWK Plattform server', function () {
  beforeEach(function (done) {
    app.start(done);
  });

  afterEach(function (done) {
    app.stop(done);
  });

  it('responds on a GET for the home page', function (done) {
    httpRequest({uri: base_uri}, function (req, resp) {
      should.exist(resp);
      resp.statusCode.should.equal(200);
      done();
    });
  });

  it('responds with HTML on a GET for the home page', function (done) {
    httpRequest({uri: base_uri}, function (req, resp) {
      resp.headers['content-type'].should.contain('text/html');
      done();
    });
  });

  it('shows "Softwerkskammer" on the home page', function (done) {
    httpRequest({uri: base_uri}, function (req, resp) {
      resp.body.should.contain('Softwerkskammer');
      done();
    });
  });

  it('provides the screen style sheet', function (done) {
    var stylesheet_uri = base_uri + '/stylesheets/screen.css';
    httpRequest({uri: stylesheet_uri}, function (req, resp) {
      resp.statusCode.should.equal(200);
      resp.headers['content-type'].should.contain('text/css');
      resp.body.should.contain('color:');
      done();
    });
  });

  it('provides the clientside membercheck functions', function (done) {
    var stylesheet_uri = base_uri + '/clientscripts/check-memberform.js';
    httpRequest({uri: stylesheet_uri}, function (req, resp) {
      resp.statusCode.should.equal(200);
      resp.headers['content-type'].should.contain('application/javascript');
      resp.body.should.contain('#memberform');
      done();
    });
  });
});
