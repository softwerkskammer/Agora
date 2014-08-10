'use strict';
var stream = require('stream');
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');
var activityresultsService = beans.get('activityresultsService');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

var OK = 200;
var CREATED = 201;

var BAD_REQUEST = 400;
var NOT_FOUND = 404;

var ActivityResult = beans.get('activityresult');

var MEMBER_ID = 1;

function stubGreenReturnForActivityResultService() {
  sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
    callback(null, new ActivityResult({
      id: activityResultName,
      photos: [
        { uri: '/gallery/fef400b5-2a1f-4f6d-86b7-d5b5716711ba.JPG', timestamp: new Date(), tags: ["hopper"]},
        { uri: '/gallery/73120aa1-80b1-4f2f-a342-4b03abc665e5.JPG', timestamp: new Date(), tags: ["hopper"]},
        { uri: '/gallery/a24a1d14-8936-403f-91d7-c6ba36343cc7.JPG', timestamp: new Date(), tags: ["hopper"]},
        { uri: '/gallery/cba13ad5-43fc-485d-a73b-7adb0138debe.JPG', timestamp: new Date(), tags: ["lovelace"]},
        { uri: '/gallery/5ca87f1d-0de0-4371-9de0-1c755fc1b9c1.JPG', timestamp: new Date(), tags: ["lovelace"]},
        { uri: '/gallery/250b1910-663c-4bb1-a0d6-4d5ed89d040d.JPG', timestamp: new Date(), tags: ["lovelace"]},
        { uri: '/gallery/e63b12ee-48ef-4126-af2c-9f87dd68bf4b.JPG', timestamp: new Date(), tags: ["lovelace"]},
        { uri: '/gallery/9aa23ef0-6565-457f-8d91-9922f22ba292.JPG', timestamp: new Date(), tags: ["lovelace"]},
        { uri: '/gallery/e766dcbc-e2da-4e72-928f-d67b9717f261.JPG', timestamp: new Date(), tags: ["lovelace"]},
        { uri: '/gallery/ad1f8bea-1785-4912-9b88-96f3cbe4b978.JPG', timestamp: new Date(), tags: ["liskov"]},
        { uri: '/gallery/9475905d-b979-4296-af47-ac0164788a1a.JPG', timestamp: new Date(), tags: ["liskov"]},
        { uri: '/gallery/fdd09e6d-baf1-4c44-a767-a786d22002bd.JPG', timestamp: new Date(), tags: ["liskov"]},
        { uri: '/gallery/85f9a5c1-46a5-470d-b3d2-fda330537457.JPG', timestamp: new Date(), tags: ["elsewhere"]},
        { uri: '/gallery/1806f88e-8ed7-4b3e-92bd-3173c9965541.JPG', timestamp: new Date(), tags: ["elsewhere"]},
        { uri: '/gallery/fc7ea3d4-9e4d-46cf-885c-2f9a98bfa058.JPG', timestamp: new Date(), tags: ["elsewhere"]},
        { uri: '/gallery/627adb49-b7ef-4765-94b9-d094463007a6.JPG', timestamp: new Date(), tags: ["elsewhere"]},
        { uri: '/gallery/9afcfea0-1aa4-41c1-9f8c-6dba1e16d6c4.JPG', timestamp: new Date(), tags: ["elsewhere"]}
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
        .expect(NOT_FOUND, done);
    });
  });

  describe('GET /{activityResultName}', function () {
    it('should return a NOT FOUND if the activity result is unknown', function (done) {
      sinon.stub(activityresultsService, 'getActivityResultByName', function (activityResultName, callback) {
        callback(new Error('There is no such activity result!'));
      });

      request(createApp())
        .get('/unknown-activity-result')
        .expect(NOT_FOUND, done);
    });

    it('should render the results if the activity result is known', function (done) {
      stubGreenReturnForActivityResultService();
      request(createApp())
        .get('/known-activity-results')
        .expect(OK, /elsewhere/, done);
    });
  });

  describe('POST /', function () {
    it('should create a new activity result', function (done) {
      var app = createApp(MEMBER_ID);
      var activityResultName = 'NewActivityResult';
      request(app)
        .post('/')
        .type('form')
        .send({ activityResultName: activityResultName })
        .expect('Location', app.path() + '/' + activityResultName)
        .expect(303, done);
    });

    it('should reject request without activityResultName parameter', function (done) {
      request(createApp(MEMBER_ID))
        .post('/')
        .type('form')
        .expect(BAD_REQUEST, done);
    });

    it('should reject request with empty activityResultName parameter', function (done) {
      request(createApp(MEMBER_ID))
        .post('/')
        .type('form')
        .send({ activityResultName: '' })
        .expect(BAD_REQUEST, done);
    });

    it('should reject requests with existing activityResultName');
  });

  it('should have a route for printing out posters with qrcodes', function (done) {
    stubGreenReturnForActivityResultService();
    request(createApp(MEMBER_ID))
      .get('/known-activity-result/print')
      .expect(200, done);
  });
});
