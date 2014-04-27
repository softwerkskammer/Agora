/*global xdescribe */
"use strict";

var moment = require('moment-timezone');

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTestWithDB').get('beans');
var activitystore = beans.get('activitystore');
var persistence = beans.get('activitiesPersistence');
var Activity = beans.get('activity');

var util = require('util');

var createApp = require('../../testutil/testHelper')('activitiesApp', beans).createApp;

xdescribe('Activity application with DB - shows activities for Group-Ids -', function () {

  var tomorrow_early = moment().add(1, 'days');
  var tomorrow_late = moment().add(1, 'days').add(1, 'hours');
  var day_after_tomorrow = moment().add(2, 'days');
  var yesterday = moment().subtract(1, 'days');
  var day_before_yesterday = moment().subtract(2, 'days');

  var futureActivity1 = new Activity({id: "futureActivity1", title: 'Future Activity 1', description: 'description1', assignedGroup: 'groupname1',
    location: 'location1', direction: 'direction1', startUnix: tomorrow_early.unix(), endUnix: day_after_tomorrow.unix(),
    url: 'url_future', owner: 'owner', resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId2'}], _registrationOpen: true }}, version: 1});
  var futureActivity2 = new Activity({id: "futureActivity2", title: 'Future Activity 2', description: 'description1', assignedGroup: 'groupname2',
    location: 'location1', direction: 'direction1', startUnix: tomorrow_late.unix(), endUnix: day_after_tomorrow.unix(),
    url: 'url_future', owner: 'owner', resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true }}, version: 1});

  var currentActivity1 = new Activity({id: "currentActivity1", title: 'Current Activity 1', description: 'description1', assignedGroup: 'groupname1',
    location: 'location1', direction: 'direction1', startUnix: yesterday.unix(), endUnix: tomorrow_early.unix(),
    url: 'url_current', owner: 'owner', resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true }}, version: 1});
  var currentActivity2 = new Activity({id: "currentActivity2", title: 'Current Activity 2', description: 'description1', assignedGroup: 'groupname2',
    location: 'location1', direction: 'direction1', startUnix: yesterday.unix(), endUnix: tomorrow_early.unix(),
    url: 'url_current', owner: 'owner', resources: {Veranstaltung: {_registeredMembers: [], _registrationOpen: true }}, version: 1});

  var pastActivity = new Activity({id: "pastActivity", title: 'Past Activity', description: 'description1', assignedGroup: 'groupname',
    location: 'location1', direction: 'direction1', startUnix: day_before_yesterday.unix(), endUnix: yesterday.unix(),
    url: 'url_past', owner: 'owner', resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true }}, version: 1});

  beforeEach(function (done) { // if this fails, you need to start your mongo DB

    persistence.drop(function () {
      activitystore.saveActivity(pastActivity, function (err) {
        if (err) { done(err); }
        activitystore.saveActivity(futureActivity1, function (err) {
          if (err) { done(err); }
          activitystore.saveActivity(futureActivity2, function (err) {
            if (err) { done(err); }
            activitystore.saveActivity(currentActivity1, function (err) {
              if (err) { done(err); }
              activitystore.saveActivity(currentActivity2, function (err) {
                done(err);
              });
            });
          });
        });
      });
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows only current and future activities of Group 1', function (done) {

    activitystore.upcomingActivitiesForGroupIds(['groupname1'], function (err, activities) {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal('Current Activity 1');
      expect(activities[1].title()).to.equal('Future Activity 1');
      done(err);
    });
  });

  it('shows current and future activities of Group 1 and activities with subscribed member', function (done) {

    activitystore.upcomingActivitiesForGroupIdsAndRegisteredMemberId(['groupname1'], 'memberId', function (err, activities) {
      expect(activities.length).to.equal(3);
      expect(activities[0].title()).to.equal('Current Activity 1');
      expect(activities[1].title()).to.equal('Future Activity 1');
      expect(activities[2].title()).to.equal('Future Activity 2');
      done(err);
    });
  });

  it('shows current and future activities of activities with subscribed member', function (done) {

    activitystore.upcomingActivitiesForGroupIdsAndRegisteredMemberId([], 'memberId', function (err, activities) {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal('Current Activity 1');
      expect(activities[1].title()).to.equal('Future Activity 2');
      done(err);
    });
  });

  it('returns an empty list if no matching activities are found', function (done) {

    activitystore.upcomingActivitiesForGroupIdsAndRegisteredMemberId([], 'unknownMemberId', function (err, activities) {
      expect(activities.length).to.equal(0);
      done(err);
    });
  });

});
