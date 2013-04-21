/*global describe, it */
"use strict";
var proxyquire = require('proxyquire');
var expect = require('chai').expect;

var Activity = require('../../lib/activities/activity');

var activityId = 'UGMUC_CodingDojo_01.04.2015';
var dummyActivity = new Activity(activityId, 'CodingDojo', 'UGMUC', 'Munich');

var activityStoreStub = {
  getActivity: function (id, callback) {
    if (id === activityId) {
      return callback(null, dummyActivity);
    }
    callback(null, null);
  },
  allActivities: function (callback) {
    callback(null, [dummyActivity]);
  }
};

var activitiesAPI = proxyquire('../../lib/activities/activitiesAPI', {
  './activitystore': function () { return activityStoreStub; }
});

var api = activitiesAPI({ get: function () { return null; } });

describe('Activities API', function () {

  it('returns the activity for the given id', function (done) {
    api.getActivity(activityId, function (err, result) {
      result.should.equal(dummyActivity);
      done();
    });
  });

  it('returns null when id is not existing', function (done) {
    api.getActivity(1234, function (err, result) {
      expect(result).to.be.a('null');
      done();
    });
  });

  it('returns all activites', function (done) {
    api.allActivities(function (err, result) {
      result.should.have.lengthOf(1);
      done();
    });
  });

});
