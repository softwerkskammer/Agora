'use strict';
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var galleryService = beans.get('galleryService');

var app = require('../../testutil/testHelper')('galleryApp').createApp();

var OK = 200;
var CREATED = 201;

describe('/gallery', function () {
  var storedImageId = 'image.jpg';
  var imagePath = __dirname + '/fixtures/' + storedImageId;
  var generatedImageId;

  afterEach(function () {
    sinon.restore();
  });

  describe('POST /', function () {
    beforeEach(function () {
      generatedImageId = '8fe5861b-53cb-49db-929f-81eb77b4d05c';
      sinon.stub(galleryService, 'storeImage', function (imagePath, callback) {
        callback(null, generatedImageId);
      });
    });

    it('responds with the image Location', function (done) {
      request(app)
        .post('/')
        .attach('imageFile', imagePath)
        .expect(CREATED)
        .expect('Location', app.path() + '/' + generatedImageId, done);
    });

  });

  describe('GET /{imageId}', function () {
    it('responds with the image', function (done) {
      sinon.stub(galleryService, 'retrieveScaledImage', function (imageId, width, height, callback) {
        if (storedImageId === imageId) {
          callback(null, imagePath);
        }
      });

      request(app)
        .get('/'  + storedImageId)
        .expect(OK)
        .expect('Content-Type', 'image/jpeg', done);
    });
  });

  describe('GET /', function () {
    it('renders the upload form', function (done) {
      request(app)
        .get('/')
        .expect(OK, done);
    });
  });

});
