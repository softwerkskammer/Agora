'use strict';
var stream = require('stream');
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var activityresultsService = beans.get('activityresultsService');
var persistence = beans.get('activityresultsPersistence');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

var ActivityResult = beans.get('activityresult');
var galleryService = beans.get('galleryService');

describe('/activityresults/:result/upload', function () {
  afterEach(function () {
    sinon.restore();
  });

  beforeEach(function () {
    sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
      callback(null, new ActivityResult({ id: 'foo', name: 'foobar'}));
    });
  });

  describe('POST /', function () {
    it('should store the image via gallery service and redirect to edit', function (done) {
      sinon.stub(galleryService, 'storeImage', function (tmpFile, callback) {
        callback(null, 'my-custom-image-id');
      });
      sinon.stub(galleryService, 'getMetadataForImage', function (tmpFile, callback) {
        callback(null);
      });
      sinon.stub(persistence, 'save', function (tmpFile, callback) {
        callback(null);
      });

      request(createApp(1))
        .post('/foo/upload')
        .attach('image', __filename)
        .expect(302)
        .expect('Location', /\/foo\/photo\/[\w+|\-]+\/edit/)
        .end(done);
    });
  });
});
