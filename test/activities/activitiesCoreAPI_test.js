"use strict";

var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();
var beans = require('../configureForTest').get('beans');
var moment = require('moment-timezone');

var Activity = beans.get('activity');

var activitystore = beans.get('activitystore');

var api = beans.get('activitiesCoreAPI');

describe('Activities Core API', function () {

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  describe('- when adding a visitor -', function () {

    it('succeeds when registration is open', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: true}}});
      sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null); });
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'getActivityForId', function (id, callback) { callback(null, activity); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, statusTitle, statusText) {
        expect(!!err, "Error: " + err).to.be.false;
        expect(!!statusTitle, "Status Title").to.be.false;
        expect(!!statusText, "Status Text").to.be.false;
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberId');
        done();
      });
    });

    it('gives a status message when registration is not open', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: false}}});

      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'getActivityForId', function (id, callback) { callback(null, activity); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, statusTitle, statusText) {
        expect(!!err, "Error").to.be.false;
        expect(statusTitle, "Status Title").to.equal('activities.registration_not_now');
        expect(statusText, "Status Text").to.equal('activities.registration_not_possible');
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.not.contain('memberId');
        done();
      });
    });

    it('succeeds when registration is not open but registrant is on waiting list and allowed to subscribe', function (done) {
      var tomorrow = moment();
      tomorrow.add('days', 1);
      var activity = new Activity({
        resources: {
          Einzelzimmer: {
            _registrationOpen: false,
            _waitinglist: [
              { _memberId: 'memberId', _registrationValidUntil: tomorrow.toDate() }
            ]
          }
        }
      });
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null); });

      api.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(!!err, "Error").to.be.false;
        expect(!!statusTitle, "Status Title").to.be.false;
        expect(!!statusText, "Status Text").to.be.false;
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberId');
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
