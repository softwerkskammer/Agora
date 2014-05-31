'use strict';
var stream = require('stream');
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var imageRepository = beans.get('imagerepositoryAPI');

var createApp = require('../../testutil/testHelper')('imagesApp').createApp;

var CREATED = 201;

describe('/images', function () {
  var imagePath = 'test/images/fixtures/image.jpg';
  var imageId;
  var storedImagePath;

  beforeEach(function () {
    imageId = '8fe5861b-53cb-49db-929f-81eb77b4d05c';
    sinon.stub(imageRepository, 'storeImage', function (imagePath, callback) {
      storedImagePath = imagePath;
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
        .attach('image', imagePath)
        .expect(CREATED)
        .expect('Location', '/images/' + imageId, done);
    });

    it('stores the image to the imagerepository', function (done) {
      request(createApp())
        .post('/')
        .attach('image', imagePath)
        .end(function () {
          expect(storedImagePath).to.match(/\/tmp\/[0-9a-z\-]+\.jpg/);
          done();
        });
    });

  });
});
