'use strict';
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var activityresultsService = beans.get('activityresultsService');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

var ActivityResult = beans.get('activityresult');

var MEMBER_ID = 'member1';

describe('/activityresults/:result/photo/:photo', function () {
  afterEach(function () {
    sinon.restore();
  });

  var photoId = 'photo_id';
  beforeEach(function () {
    sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
      /* eslint camelcase: 0 */

      callback(null, new ActivityResult({
        id: 'foo',
        name: 'foobar',
        photos: [{id: photoId, title: 'mishka', uploaded_by: MEMBER_ID}]
      }));
    });
  });

  it('should have old values set', function (done) {
    request(createApp({id: MEMBER_ID}))
      .get('/foo/photo/' + photoId + '/edit')
      .expect(function (res) {
        if (res.text.indexOf('mishka') === -1) {
          return 'Title not found';
        }
      })
      .end(done);
  });

  it('should not let me edit a photo I didn\'t upload', function (done) {
    request(createApp())
      .get('/foo/photo/' + photoId + '/edit')
      .expect(302, done);
  });

  it('should save a photos time, tags and title', function (done) {
    sinon.stub(activityresultsService, 'updatePhotoOfActivityResult', function (activityResultName, photoID, data, accessrights, callback) {
      expect(data.title).to.eql('My adventures with the softwerkskammer');
      expect(data.tags).to.eql(['a', 'b']);
      callback();
    });

    request(createApp())
      .post('/foo/photo/' + photoId + '/edit')
      .type('form')
      .send({
        'title': 'My adventures with the softwerkskammer',
        'time': '02:03',
        'date': '2015-05-04',
        'tags': ['a', 'b']
      })
      .expect(302)
      .expect('Location', '/foo')
      .end(done);
  });

  it('should not let me save changes to a photo if I didn\'t upload it', function (done) {
    sinon.stub(activityresultsService, 'updatePhotoOfActivityResult', function (activityResultName, photoID, data, accessrights, callback) {
      expect(data.title).to.eql('My adventures with the softwerkskammer');
      expect(data.tags).to.eql(['a', 'b']);
      callback();
    });

    request(createApp())
      .post('/foo/photo/' + photoId + '/edit')
      .type('form')
      .send({
        'title': 'My adventures with the softwerkskammer',
        'time': '02:03',
        'date': '2015-05-04',
        'tags': ['a', 'b']
      })
      .expect(302, done);
  });
});
