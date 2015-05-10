'use strict';
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTest').get('beans');
var activityresultsService = beans.get('activityresultsService');
var activityresultsPersistence = beans.get('activityresultsPersistence');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

var ActivityResult = beans.get('activityresult');

var MEMBER_ID = 'memberID';

function stubGreenReturnForActivityResultService() {
  sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
    callback(null, new ActivityResult({
      id: activityResultName,
      photos: [
        { uri: '/gallery/fef400b5-2a1f-4f6d-86b7-d5b5716711ba.JPG', timestamp: new Date(), tags: ['hopper']},
        { id: '73120aa1-80b1-4f2f-a342-4b03abc665e5.JPG', timestamp: new Date(), tags: ['hopper']},
        { id: 'cba13ad5-43fc-485d-a73b-7adb0138debe.JPG', timestamp: new Date(), tags: ['lovelace']},
        { id: '627adb49-b7ef-4765-94b9-d094463007a6.JPG', timestamp: new Date(), tags: ['elsewhere']},
        { id: '9afcfea0-1aa4-41c1-9f8c-6dba1e16d6c4.JPG', timestamp: new Date(), tags: ['elsewhere']}
      ]
    }));
  });
}

describe('/activityresults', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('GET /', function () {
    it('should return an OK', function (done) {
      request(createApp())
        .get('/')
        .expect(404, done);
    });
  });

  describe('GET /{activityResultName}', function () {
    it('should return an 200 if the activity result is unknown to create a new one', function (done) {
      sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
        callback();
      });

      request(createApp())
        .get('/unknown-activity-result')
        .expect(200, done);
    });

    it('should render the results if the activity result is known', function (done) {
      stubGreenReturnForActivityResultService();
      request(createApp())
        .get('/known-activity-results')
        .expect(/elsewhere/, done);
    });
  });

  describe('POST /', function () {
    it('should create a new activity result', function (done) {
      sinon.stub(activityresultsPersistence, 'save', function (activityResult, callback) {
        callback(null, activityResult);
      });

      var app = createApp({id: MEMBER_ID});
      var activityResultName = 'NewActivityResult';
      request(app)
        .post('/')
        .type('form')
        .send({ activityResultName: activityResultName })
        .expect(302, done);
    });

    it('should create a new activity result with tags', function (done) {
      var theResult;
      sinon.stub(activityresultsPersistence, 'save', function (activityResult, callback) {
        theResult = activityResult;
        callback(null, activityResult);
      });

      var app = createApp({id: MEMBER_ID});
      request(app)
        .post('/')
        .type('form')
        .send({ activityResultName: 'MyActivityResult', tags: 'myFirstTag,mySecondTag' })
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
        .send({ activityResultName: '' })
        .expect(500, done);
    });

  });

});
