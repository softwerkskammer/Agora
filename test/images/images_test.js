'use strict';
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var imageRepository = beans.get('imagerepositoryAPI');

var createApp = require('../../testutil/testHelper')('imagesApp').createApp;

var CREATED = 201;

describe('/images', function () {
  var imageId;

  beforeEach(function () {
    imageId = '8fe5861b-53cb-49db-929f-81eb77b4d05c';
    sinon.stub(imageRepository, 'storeImage', function (stream, callback) {
      callback(null, imageId);
    });
  });

  afterEach(function () {
    sinon.restore();
  });
  describe('POST /', function () {

    it('responds with the image Location', function (done) {
      request(createApp())
        .post('/')
        .expect(CREATED)
        .expect('Location', '/images/' + imageId, done);
    });
  });
});
