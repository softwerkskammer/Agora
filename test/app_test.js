"use strict";
var should = require('chai').should();
var httpRequest = require('request');
var request = require('supertest');
var conf = require('./configureForTest');

var base_uri = "http://localhost:" + parseInt(conf.get('port'), 10);

var app = require('../app.js')();

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

  it('shows a carousel on the home page if no user is authenticated', function (done) {
    httpRequest({uri: base_uri}, function (req, resp) {
      resp.body.should.contain('carousel');
      done();
    });
  });

  it('provides the bootstrap style sheet', function (done) {
    var stylesheet_uri = base_uri + '/stylesheets/bootstrap.css';
    httpRequest({uri: stylesheet_uri}, function (req, resp) {
      resp.statusCode.should.equal(200);
      resp.headers['content-type'].should.contain('text/css');
      resp.body.should.contain('color:');
      done();
    });
  });

  it('provides the bootstrap-responsive style sheet', function (done) {
    var stylesheet_uri = base_uri + '/stylesheets/bootstrap-responsive.css';
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

describe('The app itself', function () {
  it('redirects unauthenticated access to the members sub app to the authentication page', function (done) {
    request(app.create())
      .get('/members/')
      .expect('Content-Type', /text\/plain/)
      .expect('Moved Temporarily. Redirecting to /login')
      .expect(302, done);
  });
});
