'use strict';
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinonSandbox = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var imageRepository = beans.get('imagerepositoryAPI');

var createApp = require('../../testutil/testHelper')('imagesApp').createApp;

var CREATED = 201;

describe('/images', function () {
  var imageId;

  beforeEach(function () {
    imageId = '8fe5861b-53cb-49db-929f-81eb77b4d05c';
    sinonSandbox.stub(imageRepository, 'storeImage', function (callback) {
      return callback(null, imageId);
    });
  });

  describe('POST /', function () {
//    it('writes to the imageRepository', function (done) {
//      request(createApp())
//        .post('/')
//        .expect(200)
//        .expect(/<input id="thruDate" type="text" name="thruDate" value="31\.12\.2013"/)
//        .expect(/<legend>Nachricht bearbeiten/, function (err) {
//          expect(getAnnouncement.calledWith(url)).to.be(true);
//          done(err);
//        });
//    });

    it('responds with the image Location', function (done) {
      request(createApp())
        .post('/')
        .expect(CREATED)
        .expect('Location', '/images/' + imageId, done);
    });
  });
});
