"use strict";

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var beans = require('../configureForTest').get('beans');

var createApp = require('../testHelper')('membersApp').createApp;
var membersAPI = beans.get('membersAPI');


describe('Security regarding', function () {

  describe('Clickjacking:', function () {

    beforeEach(function () {
      sinon.stub(membersAPI, 'allMembers', function (callback) { callback(null, []); });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('sends an X-Frame-Options header', function (done) {
      var app = createApp(null, beans.get('secureAgainstClickjacking'));

      request(app)
        .get('/')
        .expect('X-Frame-Options', 'DENY', done);
    });

  });

});
