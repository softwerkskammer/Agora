/*global describe, beforeEach, afterEach, it */
"use strict";
var should = require('chai').should(),
  httpRequest = require('request'),
  request = require('supertest'),
  MongoConf = require('./mongoConf'),
  conf = new MongoConf();

conf.set('port', '17125');
conf.set('secret', 'secret');
var base_uri = "http://localhost:" + parseInt(conf.get('port'), 10);

var app = require('../app.js')(conf);

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

  it('shows "log in" on the home page if no user is authenticated', function (done) {
    httpRequest({uri: base_uri}, function (req, resp) {
      resp.body.should.contain('log in');
      done();
    });
  });

  it('has events app', function (done) {
    httpRequest({uri: base_uri + '/events'}, function (req, res) {
      res.statusCode.should.equal(200);
      res.headers['content-type'].should.contain('text/html');
      res.body.should.contain('events');
      done();
    });
  });

  it('provides the style sheet', function (done) {
    var stylesheet_uri = base_uri + '/stylesheets/style.css';
    httpRequest({uri: stylesheet_uri}, function (req, resp) {
      resp.statusCode.should.equal(200);
      resp.headers['content-type'].should.contain('text/css');
      resp.body.should.contain('color:');
      done();
    });
  });
});

describe('The app itself', function () {
  it('redirects for a sub app without trailing "/" to the sub app with "/"', function (done) {
    request(app.create())
      .get('/events')
      .expect(302)
      .end(function (err, res) {
        res.header['location'].should.equal('/events/');
        done();
      });
  });

  it('has the events sub app', function (done) {
    request(app.create())
      .get('/events/')
      .expect('Content-Type', /text\/html/)
      .expect(/events/)
      .expect(200, done);
  });
});
