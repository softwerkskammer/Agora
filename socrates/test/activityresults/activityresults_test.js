'use strict';
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var activityresultsService = beans.get('activityresultsService');
var activityresultsPersistence = beans.get('activityresultsPersistence');

var createApp = require('../../testutil/testHelper')('socratesActivityresultsApp').createApp;

var ActivityResult = beans.get('activityresult');

var MEMBER_ID = 'memberID';

describe('SoCraTes activityresults application', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('for retrieval', function () {
    it('should return a 404 for non given result\'s name', function (done) {
      request(createApp())
        .get('/')
        .expect(404, done);
    });

    it('should allow to create a new one with the name if not existing yet', function (done) {
      sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
        callback();
      });

      request(createApp())
        .get('/unknown-activity-result')
        .expect(/<h2>New Session Snap Collection<\/h2>/, done);
    });

    it('should render the results if the activity result is known', function (done) {
      sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
        callback(null, new ActivityResult({
          id: activityResultName,
          title: 'TITLE for ' + activityResultName,
          photos: [
            {uri: '/gallery/fef400b5-2a1f-4f6d-86b7-d5b5716711ba.JPG', timestamp: new Date(), tags: ['hopper']},
            {id: '73120aa1-80b1-4f2f-a342-4b03abc665e5.JPG', timestamp: new Date(), tags: ['hopper']},
            {id: 'cba13ad5-43fc-485d-a73b-7adb0138debe.JPG', timestamp: new Date(), tags: ['lovelace']},
            {id: '627adb49-b7ef-4765-94b9-d094463007a6.JPG', timestamp: new Date(), tags: ['elsewhere']},
            {id: '9afcfea0-1aa4-41c1-9f8c-6dba1e16d6c4.JPG', timestamp: new Date(), tags: ['elsewhere']}
          ]
        }));
      });

      request(createApp())
        .get('/known-activity-results')
        .expect(/elsewhere/, done);
    });
  });

  describe('for creation and uploading', function () {
    it('should create a new activity result with tags', function (done) {
      var theResult;
      sinon.stub(activityresultsPersistence, 'save', function (activityResult, callback) {
        theResult = activityResult;
        callback(null, activityResult);
      });

      request(createApp({id: MEMBER_ID}))
        .post('/')
        .type('form')
        .send({activityResultName: 'MyActivityResult', tags: 'myFirstTag,mySecondTag'})
        .expect(302)
        .end(function (err) {
          expect(theResult.tags).to.eql(['myFirstTag', 'mySecondTag']);
          done(err);
        });
    });

    it('should reject request without activityResultName parameter', function (done) {
      request(createApp())
        .post('/')
        .type('form')
        .expect(500, done);
    });

    it('should reject request with empty activityResultName parameter', function (done) {
      request(createApp())
        .post('/')
        .type('form')
        .send({activityResultName: ''})
        .expect(500, done);
    });

    it('should store an image and redirect to edit', function (done) {
      sinon.stub(activityresultsService, 'addPhotoToActivityResult', function (activity, photo, user, callback) {
        callback(null, 'my-custom-image-id');
      });

      request(createApp({id: 'memberId'}))
        .post('/foo/upload')
        .attach('image', __filename)
        .expect(302)
        .expect('Location', /\/foo\/photo\/my-custom-image-id\/edit/)
        .end(done);
    });
  });

  describe('editing photos', function () {
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
});
