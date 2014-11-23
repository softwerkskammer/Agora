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

  afterEach(function () {
    sinon.restore();
  });

  it('GET /{imageId} responds with the image', function (done) {
    sinon.stub(galleryService, 'retrieveScaledImage', function (imageId, width, height, callback) {
      if (storedImageId === imageId) {
        callback(null, imagePath);
      }
    });

    request(app)
      .get('/' + storedImageId)
      .expect(OK)
      .expect('Content-Type', 'image/jpeg', done);
  });

});
