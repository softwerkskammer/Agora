'use strict';
var stream = require('stream');
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var imageRepository = beans.get('imagerepositoryAPI');

var createApp = require('../../testutil/testHelper')('imagesApp').createApp;

var OK = 200;
var CREATED = 201;

describe('/images', function () {
  var storedImageId = 'image.jpg';
  var imagePath = 'test/images/fixtures/' + storedImageId;
  var generatedImageId;
  var storedImagePath;

  afterEach(function () {
    sinon.restore();
  });

  describe('POST /', function () {
    beforeEach(function () {
      generatedImageId = '8fe5861b-53cb-49db-929f-81eb77b4d05c';
      sinon.stub(imageRepository, 'storeImage', function (imagePath, callback) {
        storedImagePath = imagePath;
        callback(null, generatedImageId);
      });
    });

    it('responds with the image Location', function (done) {
      request(createApp())
        .post('/')
        .attach('image', imagePath)
        .expect(CREATED)
        .expect('Location', '/images/' + generatedImageId, done);
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

  describe('GET /{imageId}', function () {
    it('responds with the image', function (done) {
      sinon.stub(imageRepository, 'retrieveImage', function (imageId, callback) {
        if (storedImageId === imageId) {
          callback(null, imagePath);
        }
      });

      request(createApp())
        .get('/'  + storedImageId)
        .expect(OK)
        .expect('Content-Type', 'image/jpeg', done);
    });
  });

  describe('GET /', function () {
    it('renders the upload form', function (done) {
      request(createApp())
        .get('/')
        .expect(OK, done);
    });
  });

});
