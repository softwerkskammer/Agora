"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var conf = require('../configureForTest');
var moment = require('moment-timezone');

var Activity = conf.get('beans').get('activity');

var activityId = 'UGMUC_CodingDojo_01.04.2015';
var dummyActivity = new Activity().fillFromDB({id: activityId, url: 'url', title: 'CodingDojo', assignedGroup: 'UGMUC', location: 'Munich'});

var store = conf.get('beans').get('activitystore');

var api = conf.get('beans').get('activitiesCoreAPI');

describe('Activities Core API', function () {

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('returns the activity for the given id', function (done) {
    sinonSandbox.stub(store, 'getActivity', function (id, callback) {
      return callback(null, dummyActivity);
    });

    api.getActivity(activityId, function (err, result) {
      expect(result).to.equal(dummyActivity);
      done();
    });
  });

  it('returns null when id is not existing', function (done) {
    sinonSandbox.stub(store, 'getActivity', function (id, callback) {
      callback(null, null);
    });

    api.getActivity(1234, function (err, result) {
      expect(result).to.be.a('null');
      done();
    });
  });

  it('returns all activites', function (done) {
    sinonSandbox.stub(store, 'allActivities', function (callback) {
      callback(null, [dummyActivity]);
    });
    api.allActivities(function (err, result) {
      expect(result).to.have.lengthOf(1);
      done();
    });
  });

  it('returns past activities', function (done) {
    var now = moment('2013-08-07 22:28:42.123');
    var start = 0;
    var end = moment('2013-08-07 22:28:42.123').unix();

    sinonSandbox.stub(store, 'allActivitiesByDateRangeInDescendingOrder')
      .withArgs(start, end, sinon.match.func)
      .callsArgWith(2, null, [ dummyActivity ]);

    var callback = function (err, result) {
      expect(result).to.have.lengthOf(1);
      done();
    };

    api.pastActivities(callback, now);
  });

  it('returns upcoming activities', function (done) {
    var now = moment('2013-08-07 22:28:42.123');
    var start = moment('2013-08-07 22:28:42.123').unix();
    var end = moment('2023-08-07 22:28:42.123').unix();

    sinonSandbox.stub(store, 'allActivitiesByDateRangeInAscendingOrder')
      .withArgs(start, end, sinon.match.func)
      .callsArgWith(2, null, [ dummyActivity ]);

    var callback = function (err, result) {
      expect(result).to.have.lengthOf(1);
      done();
    };

    api.upcomingActivities(callback, now);
  });

});
