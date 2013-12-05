"use strict";

var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();
var beans = require('../configureForTest').get('beans');
var moment = require('moment-timezone');

var Activity = beans.get('activity');

var activityId = 'UGMUC_CodingDojo_01.04.2015';
var dummyActivity = new Activity({id: activityId, url: 'url', title: 'CodingDojo', assignedGroup: 'UGMUC', location: 'Munich'});

var activitystore = beans.get('activitystore');

var api = beans.get('activitiesCoreAPI');
var waitinglistAPI = beans.get('waitinglistAPI');

describe('Activities Core API', function () {

  afterEach(function (done) {
    sinon.restore();
    done();
  });


  it('returns past activities', function (done) {
    sinon.stub(activitystore, 'allActivitiesByDateRangeInDescendingOrder', function (start, end, callback) {
      return callback(null, [ dummyActivity ]);
    });

    api.pastActivities(function (err, result) {
      expect(result).to.have.lengthOf(1);
      done();
    });
  });

  it('returns upcoming activities', function (done) {
    sinon.stub(activitystore, 'allActivitiesByDateRangeInAscendingOrder', function (start, end, callback) {
      return callback(null, [dummyActivity]);
    });

    api.upcomingActivities(function (err, result) {
      expect(result).to.have.lengthOf(1);
      done();
    });
  });

  describe('- when adding a visitor -', function () {

    it('succeeds when registration is open', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: true}}});
      sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'getActivityForId', function (id, callback) { callback(null, activity); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, savedActivity, statusTitle, statusText) {
        expect(!!err, "Error: " + err).to.be.false;
        expect(!!statusTitle, "Status Title").to.be.false;
        expect(!!statusText, "Status Text").to.be.false;
        expect(activity.registeredMembers('Einzelzimmer')).to.contain('memberId');
        done();
      });
    });

    it('gives a status message when registration is not open', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: false}}});

      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'getActivityForId', function (id, callback) { callback(null, activity); });

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
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null, activity); });

      sinon.stub(waitinglistAPI, 'canSubscribe', function (memberId, activityId, resourceName, callback) {return callback(null, true); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, savedActivity, statusTitle, statusText) {
        expect(!!err, "Error").to.be.false;
        expect(!!statusTitle, "Status Title").to.be.false;
        expect(!!statusText, "Status Text").to.be.false;
        expect(activity.registeredMembers('Einzelzimmer')).to.contain('memberId');
        done();
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error("error")); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err) {
        expect(!!err, "Error").to.be.true;
        done();
      });
    });
  });

});
