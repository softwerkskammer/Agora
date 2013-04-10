/*global describe, it */
"use strict";
var proxyquire = require('proxyquire'),
  MongoConf = require('./mongoConf'),
  conf = new MongoConf();

var Activity = require('../lib/activities/activity');

var dummyActivity = new Activity('id', 'title', 'description', 'assignedGroup', 'location', 'direction', 'activityDate', 'startTime');

var activityStoreStub = {
  getActivity: function (id, callback) {
    if (new RegExp(id, 'i').test('id')) {
      return callback(null, dummyActivity);
    }
    callback(null, null);
  }
};

var api = proxyquire('../lib/activities/activitiesAPI', {
  './activityStoreStub': function () {
    return activityStoreStub;
  }
})(conf);

describe('ActivitiesAPI', function () {
  it('creates an id if the given id is undefined/not filled', function (done) {
    api.isValidNickname(' haDa ', function (err, result) {
      result.should.be.false;
      done();
    });
  });
});
