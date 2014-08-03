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
var galleryRepository = beans.get('galleryrepositoryService');

describe('/activityresults/:result/upload', function () {
  afterEach(function () {
    sinon.restore();
  });

  beforeEach(function () {
    sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
      callback(null, new ActivityResult({ id: "foo", name: "foobar"}));
    });
  });

  describe("POST /", function () {
    it("should store the image via gallery service and redirect to edit", function (done) {
      sinon.stub(galleryRepository, 'storeImage', function (tmpFile, callback) {
        callback(null, "my-custom-image-id");
      });

      //noinspection JSLint
      request(createApp(1))
        .post('/foo/upload')
        .attach('image', __filename)
        .expect(303)
        .expect('Location', /\/foo\/photo\/[\w+|\-]+\/edit/)
        .end(done);
    });
  });
});
