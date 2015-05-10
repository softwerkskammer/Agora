'use strict';

var moment = require('moment-timezone');
var expect = require('must');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTestWithDB').get('beans');
var persistence = beans.get('activitiesPersistence');
var activitystore = beans.get('activitystore');
var activitiesService = beans.get('activitiesService');
var notifications = beans.get('notifications');

var Activity = beans.get('activity');

var activityUrl = 'urlOfTheActivity';

var getActivity = function (url, callback) {
  persistence.getByField({url: url}, function (err, activityState) {
    callback(err, new Activity(activityState));
  });
};

describe('Activities Service with DB', function () {

  var activityBeforeConcurrentAccess;
  var activityAfterConcurrentAccess;
  var invocation;

  beforeEach(function (done) { // if this fails, you need to start your mongo DB
    activityBeforeConcurrentAccess = new Activity(
      {id: 'activityId', url: activityUrl, resources: {
        'default': { _registeredMembers: [
          {memberId: 'memberIdX'}
        ], _waitinglist: [
          {_memberId: 'memberIdY'}
        ], _registrationOpen: true }
      }, version: 1}
    );

    activityAfterConcurrentAccess = new Activity(
      {id: 'activityId', url: activityUrl, resources: {
        'default': {_registeredMembers: [
          {memberId: 'memberId1'},
          {memberId: 'memberIdX'}
        ], _waitinglist: [
          {_memberId: 'memberIdY'}
        ], _registrationOpen: true }
      }, version: 2}
    );

    invocation = 1;

    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      // on the first invocation, getActivity returns an activity without registrant to mimick a racing condition.
      if (invocation === 1) {
        invocation = 2;
        return callback(null, activityBeforeConcurrentAccess);
      }
      // on subsequent invocations, getActivity returns an activity with registrant.
      return callback(null, activityAfterConcurrentAccess);
    });

    persistence.drop(function () {
      // save our activity with one registrant
      activitystore.saveActivity(activityAfterConcurrentAccess, function (err) {
        done(err);
      });
    });

    sinon.stub(notifications, 'visitorRegistration');
    sinon.stub(notifications, 'visitorUnregistration');
    sinon.stub(notifications, 'waitinglistAddition');
    sinon.stub(notifications, 'waitinglistRemoval');
  });

  afterEach(function () {
    sinon.restore();
  });

  it('addVisitor keeps the registrant that is in the database although it only reads an activity without registrant', function (done) {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    activitiesService.addVisitorTo('memberId2', activityUrl, 'default', moment(), function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err1, activity) {
        if (err1) { return done(err1); }
        expect(activity.resourceNamed('default').registeredMembers(), 'Second registered member is stored in the database').to.contain('memberId2');
        expect(activity.resourceNamed('default').registeredMembers(), 'First registered member is still there').to.contain('memberId1');
        done(err1);
      });
    });
  });

  it('removeVisitor keeps the registrant that is in the database although it only reads an activity without registrant', function (done) {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first 'getActivity'.
    activitiesService.removeVisitorFrom('memberIdX', activityUrl, 'default', function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err1, activity) {
        if (err1) { return done(err1); }
        expect(activity.resourceNamed('default').registeredMembers(), 'Second removed member is no longer in the database').to.not.contain('memberIdX');
        expect(activity.resourceNamed('default').registeredMembers(), 'First registered member is still there').to.contain('memberId1');
        done(err1);
      });
    });
  });

  it('addToWaitinglist keeps the registrant that is in the database although it only reads an activity without registrant', function (done) {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    activitiesService.addToWaitinglist('memberId2', activityUrl, 'default', moment(), function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err1, activity) {
        if (err1) { return done(err1); }
        expect(activity.resourceNamed('default').waitinglistEntries()[0].registrantId(), 'Previous member is still in the waitinglist').to.equal('memberIdY');
        expect(activity.resourceNamed('default').waitinglistEntries()[1].registrantId(), 'Second member is stored in the waitinglist').to.equal('memberId2');
        expect(activity.resourceNamed('default').registeredMembers(), 'First registered member is still there').to.contain('memberId1');
        done(err1);
      });
    });
  });

  it('removeFromWaitinglist keeps the registrant that is in the database although it only reads an activity without registrant', function (done) {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    activitiesService.removeFromWaitinglist('memberIdY', activityUrl, 'default', function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err1, activity) {
        if (err1) { return done(err1); }
        expect(activity.resourceNamed('default').waitinglistEntries().length, 'Waitinglist member is no longer in the database').to.equal(0);
        expect(activity.resourceNamed('default').registeredMembers(), 'First registered member is still there').to.contain('memberId1');
        done(err1);
      });
    });
  });

});
