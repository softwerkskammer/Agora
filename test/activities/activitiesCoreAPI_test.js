"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var beans = require('../configureForTest').get('beans');
var moment = require('moment-timezone');

var Activity = beans.get('activity');

var activityId = 'UGMUC_CodingDojo_01.04.2015';
var dummyActivity = new Activity({id: activityId, url: 'url', title: 'CodingDojo', assignedGroup: 'UGMUC', location: 'Munich'});

var store = beans.get('activitystore');

var api = beans.get('activitiesCoreAPI');
var waitinglistAPI = beans.get('waitinglistAPI');

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

  describe('- when adding a visitor -', function () {

    it('succeeds when registration is open', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: true}}});
      sinonSandbox.stub(store, 'saveActivity', function (id, callback) { callback(null, activity); });
      sinonSandbox.stub(store, 'getActivity', function (id, callback) { callback(null, activity); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, savedActivity, statusTitle, statusText) {
        expect(!!err, "Error").to.be.false;
        expect(!!statusTitle, "Status Title").to.be.false;
        expect(!!statusText, "Status Text").to.be.false;
        expect(activity.registeredMembers('Einzelzimmer')).to.contain('memberId');
        done();
      });
    });

    it('gives a status message when registration is not open', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: false}}});

      sinonSandbox.stub(store, 'getActivity', function (id, callback) { callback(null, activity); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, savedActivity, statusTitle, statusText) {
        expect(!!err, "Error").to.be.false;
        expect(statusTitle, "Status Title").to.equal('Die Anmeldung ist momentan nicht möglich.');
        expect(statusText, "Status Text").to.equal('Die Anmeldung ist noch nicht freigegeben, oder alle Plätze sind belegt.');
        expect(activity.registeredMembers('Einzelzimmer')).to.not.contain('memberId');
        done();
      });
    });

    it('succeeds when registration is not open but registrant is on waiting list and allowed to subscribe', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: false}}});
      sinonSandbox.stub(store, 'getActivity', function (id, callback) { callback(null, activity); });
      sinonSandbox.stub(store, 'saveActivity', function (id, callback) { callback(null, activity); });

      sinonSandbox.stub(waitinglistAPI, 'canSubscribe', function (memberId, activityUrl, resourceName, callback) {return callback(null, true); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, savedActivity, statusTitle, statusText) {
        expect(!!err, "Error").to.be.false;
        expect(!!statusTitle, "Status Title").to.be.false;
        expect(!!statusText, "Status Text").to.be.false;
        expect(activity.registeredMembers('Einzelzimmer')).to.contain('memberId');
        done();
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinonSandbox.stub(store, 'getActivity', function (id, callback) { callback(new Error("error")); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err) {
        expect(!!err, "Error").to.be.true;
        done();
      });
    });
  });

});
