'use strict';
var stream = require('stream');
var conf = require('../../testutil/configureForTest');
var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = conf.get('beans');

var createApp = require('../../testutil/testHelper')('activityresultsApp').createApp;

var OK = 200;
var CREATED = 201;

describe('/activityresults', function () {
  afterEach(function () {
    sinon.restore();
  });

  describe('GET /', function () {
    it('should return an OK', function (done) {
      request(createApp())
        .get('/')
        .expect(OK, done);
    });
  });

});
