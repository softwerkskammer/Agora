'use strict';
var stream = require('stream');
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var activityresultsService = beans.get('activityresultsService');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

var OK = 200;
var CREATED = 201;

var BAD_REQUEST = 400;
var NOT_FOUND = 404;

var ActivityResult = beans.get('activityresult');

describe('/activityresults', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('GET /', function () {
    it('should return an OK', function (done) {
      request(createApp())
        .get('/')
        .expect(NOT_FOUND, done);
    });
  });

  describe('GET /{activityResultName}', function () {
    it('should return a NOT FOUND if the activity result is unknown', function (done) {
      sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
        callback(new Error('There is no such activity result!'));
      });

      request(createApp())
        .get('/unknown-activity-result')
        .expect(NOT_FOUND, done);
    });

    it('should render the results if the activity result is known', function (done) {
      sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
        callback(null, new ActivityResult());
      });

      request(createApp())
        .get('/known-activity-results')
        .expect(OK, done);
    });
  });

  describe('POST /', function () {
    it('should create a new activity result', function (done) {
      var app = createApp();
      var activityResultName = 'NewActivityResult';
      request(app)
        .post('/')
        .type('form')
        .send({ activityResultName: activityResultName })
        .expect('Location', app.path() + '/' + activityResultName)
        .expect(303, done);
    });

    it('should reject request without activityResultName parameter', function (done) {
      request(createApp())
        .post('/')
        .type('form')
        .expect(BAD_REQUEST, done);
    });

    it('should reject request with empty activityResultName parameter', function (done) {
      request(createApp())
        .post('/')
        .type('form')
        .send({ activityResultName: '' })
        .expect(BAD_REQUEST, done);
    });

    it('should reject requests with existing activityResultName');
  });
});
