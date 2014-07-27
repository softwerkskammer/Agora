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

describe('/activityresults/:result/upload', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe("GET /", function () {
    it("should return the RECORD page", function (done) {
      sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
        callback(null, new ActivityResult({ id: "foo", name: "foobar"}));
      });



      request(createApp()).get("/foo/upload").expect(200, done);
    });
  });
});
