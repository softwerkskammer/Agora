'use strict';
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var activityresultsService = beans.get('activityresultsService');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

var ActivityResult = beans.get('activityresult');
var galleryRepository = beans.get('galleryrepositoryService');

describe('/activityresults/:result/photo/:photo', function () {
  afterEach(function () {
    sinon.restore();
  });

  var photoId = 'photo_id';
  beforeEach(function () {
    sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
      callback(null, new ActivityResult({ id: "foo", name: "foobar", photos: [{id: photoId}]}));
    });
    sinon.stub(activityresultsService, 'addPhotoToActivityResult', function (activityResultName, photo, callback) {
      callback();
    });
  });

  it('should save a photos time, tags and title', function (done) {
    request(createApp())
      .post('/foo/photo/' + photoId + '/edit')
      .field('title', 'My adventures with the softwerkskammer')
      .field('time', '02:03')
      .field('date', '2015-05-04')
      .field('tag', 'a')
      .field('tag', 'b')
      .expect(303)
      .expect('Location', '/foo')
      .end(done);
  });
});
