'use strict';
var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var galleryService = beans.get('galleryService');

var app = require('../../testutil/testHelper')('galleryApp').createApp();

var OK = 200;

describe('/gallery', function () {
  /* eslint no-path-concat: 0 */
  var storedImageId = 'image.jpg';
  var imagePath = __dirname + '/fixtures/' + storedImageId;

  afterEach(function () {
    sinon.restore();
  });

  it('GET /{imageId} responds with the image', function (done) {
    sinon.stub(galleryService, 'retrieveScaledImage', function (imageId, width, callback) {
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
