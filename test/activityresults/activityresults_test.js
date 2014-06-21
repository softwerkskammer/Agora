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

var NOT_FOUND = 404;

function ActivityResult() { }

describe('/activityresults', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('GET /', function () {
    it('should return an OK', function (done) {
      request(createApp())
        .get('/')
        .expect(OK, done);
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
        .expect(200, done);
    });
  });

  describe('POST /', function () {
    it('should validate the activityresultName parameter');
  });
});
