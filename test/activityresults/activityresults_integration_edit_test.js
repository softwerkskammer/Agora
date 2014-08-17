'use strict';
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var activityresultsService = beans.get('activityresultsService');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

var ActivityResult = beans.get('activityresult');
var galleryService = beans.get('galleryService');

var MEMBER_ID = 1;
var OTHER_MEMBER_ID = 2;

describe('/activityresults/:result/photo/:photo', function () {
  afterEach(function () {
    sinon.restore();
  });

  var photoId = 'photo_id';
  beforeEach(function () {
    sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
      callback(null, new ActivityResult({ id: "foo", name: "foobar", created_by: MEMBER_ID, photos: [{id: photoId, title: 'mishka', uploaded_by: MEMBER_ID}]}));
    });
    sinon.stub(activityresultsService, 'addPhotoToActivityResult', function (activityResultName, photo, callback) {
      callback();
    });
  });

  it('should have old values set', function (done) {
    request(createApp(MEMBER_ID))
      .get("/foo/photo/" + photoId + '/edit')
      .expect(function (res) {
        if (res.text.indexOf('mishka') === -1) {
          return 'Title not found';
        }
      })
      .end(done);
  });

  it('should not let me edit a photo i didnt upload', function (done) {
    request(createApp(OTHER_MEMBER_ID))
      .get("/foo/photo/" + photoId + '/edit')
      .expect(403, done);
  });

  it('should save a photos time, tags and title', function (done) {
    sinon.stub(activityresultsService, 'updatePhotoOfActivityResult', function (activityResultName, photoId, data, callback) {
      expect(data.title).to.eql('My adventures with the softwerkskammer');
      expect(data.tags).to.eql(['a', 'b']);
      callback();
    });

    request(createApp(MEMBER_ID))
      .post('/foo/photo/' + photoId + '/edit')
      .type('form')
      .send({
        'title': 'My adventures with the softwerkskammer',
        'time': '02:03',
        'date': '2015-05-04',
        'tag': ['a', 'b']
      })
      .expect(303)
      .expect('Location', '/foo')
      .end(done);
  });

  it('should not let me save changes to a photo if i didnt upload it', function (done) {
    sinon.stub(activityresultsService, 'updatePhotoOfActivityResult', function (activityResultName, photoId, data, callback) {
      expect(data.title).to.eql('My adventures with the softwerkskammer');
      expect(data.tags).to.eql(['a', 'b']);
      callback();
    });

    request(createApp(OTHER_MEMBER_ID))
      .post('/foo/photo/' + photoId + '/edit')
      .type('form')
      .send({
        'title': 'My adventures with the softwerkskammer',
        'time': '02:03',
        'date': '2015-05-04',
        'tag': ['a', 'b']
      })
      .expect(403, done);
  });
});
