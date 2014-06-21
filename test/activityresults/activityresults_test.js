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
    it('should return a NOT FOUND if the activityResult is unknown', function (done) {
      sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
        callback(new Error('There is no such activity result!'));
      });

      request(createApp())
        .get('/unknown-activity')
        .expect(NOT_FOUND, done);
    });
  });
});
