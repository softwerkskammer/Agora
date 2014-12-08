'use strict';
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var activityresultsService = beans.get('activityresultsService');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

describe('/activityresults/:result/upload', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('POST /', function () {
    it('should store the image via gallery service and redirect to edit', function (done) {
      sinon.stub(activityresultsService, 'addPhotoToActivityResult', function (activity, photo, user, callback) {
        callback(null, 'my-custom-image-id');
      });

      request(createApp(1))
        .post('/foo/upload')
        .attach('image', __filename)
        .expect(302)
        .expect('Location', /\/foo\/photo\/my-custom-image-id\/edit/)
        .end(done);
    });
  });
});
