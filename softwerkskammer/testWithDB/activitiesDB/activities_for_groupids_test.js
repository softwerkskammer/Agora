'use strict';

var moment = require('moment-timezone');

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTestWithDB').get('beans');
var activitystore = beans.get('activitystore');
var persistence = beans.get('activitiesPersistence');
var Activity = beans.get('activity');

describe('Activity application with DB - shows activities for Group-Ids -', function () {

  var tomorrowEarly = moment().add(1, 'days');
  var tomorrowLate = moment().add(1, 'days').add(1, 'hours');
  var dayAfterTomorrow = moment().add(2, 'days');
  var yesterday = moment().subtract(1, 'days');
  var dayBeforeYesterday = moment().subtract(2, 'days');
  var threeDaysAgo = moment().subtract(3, 'days');

  var futureActivity1 = new Activity({
    id: 'futureActivity1', title: 'Future Activity 1', description: 'description1', assignedGroup: 'groupname1',
    location: 'location1', direction: 'direction1', startUnix: tomorrowEarly.unix(), endUnix: dayAfterTomorrow.unix(),
    url: 'url_future', owner: 'owner', resources: {
      Veranstaltung: {_registeredMembers: [{memberId: 'memberId2'}], _registrationOpen: true},
      AndereVeranstaltung: {_registeredMembers: [{memberId: 'memberId2'}], _registrationOpen: true}
    }, version: 1
  });
  var futureActivity2 = new Activity({
    id: 'futureActivity2',
    title: 'Future Activity 2',
    description: 'description1',
    assignedGroup: 'groupname2',
    location: 'location1',
    direction: 'direction1',
    startUnix: tomorrowLate.unix(),
    endUnix: dayAfterTomorrow.unix(),
    url: 'url_future',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  var currentActivity1 = new Activity({
    id: 'currentActivity1',
    title: 'Current Activity 1',
    description: 'description1',
    assignedGroup: 'groupname1',
    location: 'location1',
    direction: 'direction1',
    startUnix: yesterday.unix(),
    endUnix: tomorrowEarly.unix(),
    url: 'url_current',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });
  var currentActivity2 = new Activity({
    id: 'currentActivity2', title: 'Current Activity 2', description: 'description1', assignedGroup: 'groupname2',
    location: 'location1', direction: 'direction1', startUnix: yesterday.unix(), endUnix: tomorrowEarly.unix(),
    url: 'url_current', owner: 'owner', resources: {Veranstaltung: {}}, version: 1
  }); // resource has no registered members!

  var pastActivity1 = new Activity({
    id: 'pastActivity1',
    title: 'Past Activity 1',
    description: 'description1',
    assignedGroup: 'groupname',
    location: 'location1',
    direction: 'direction1',
    startUnix: dayBeforeYesterday.unix(),
    endUnix: yesterday.unix(),
    url: 'url_past',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  var pastActivity2 = new Activity({
    id: 'pastActivity2',
    title: 'Past Activity 2',
    description: 'description1',
    assignedGroup: 'groupname',
    location: 'location1',
    direction: 'direction1',
    startUnix: threeDaysAgo.unix(),
    endUnix: threeDaysAgo.unix(),
    url: 'url_past',
    owner: 'owner',
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  beforeEach(function (done) { // if this fails, you need to start your mongo DB

    persistence.drop(function () {
      activitystore.saveActivity(pastActivity1, function (err) {
        if (err) { done(err); }
        activitystore.saveActivity(pastActivity2, function (err1) {
          if (err1) { done(err1); }
          activitystore.saveActivity(futureActivity1, function (err2) {
            if (err2) { done(err2); }
            activitystore.saveActivity(futureActivity2, function (err3) {
              if (err3) { done(err3); }
              activitystore.saveActivity(currentActivity1, function (err4) {
                if (err4) { done(err4); }
                activitystore.saveActivity(currentActivity2, function (err5) {
                  done(err5);
                });
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

    activitystore.activitiesForGroupIdsAndRegisteredMemberId(['groupname1'], 'memberId', true, function (err, activities) {
      expect(activities.length).to.equal(3);
      expect(activities[0].title()).to.equal('Current Activity 1');
      expect(activities[1].title()).to.equal('Future Activity 1');
      expect(activities[2].title()).to.equal('Future Activity 2');
      done(err);
    });
  });

  it('shows activity only once even if member is subscribed to multiple resources', function (done) {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], 'memberId2', true, function (err, activities) {
      expect(activities.length).to.equal(1);
      expect(activities[0].title()).to.equal('Future Activity 1');
      done(err);
    });
  });

  it('shows past activities of Group 1 and activities with subscribed member', function (done) {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId(['groupname1'], 'memberId', false, function (err, activities) {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal('Past Activity 1');
      expect(activities[1].title()).to.equal('Past Activity 2');
      done(err);
    });
  });

  it('shows current and future activities of activities with subscribed member', function (done) {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], 'memberId', true, function (err, activities) {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal('Current Activity 1');
      expect(activities[1].title()).to.equal('Future Activity 2');
      done(err);
    });
  });

  it('returns an empty list if no matching activities are found', function (done) {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], 'unknownMemberId', true, function (err, activities) {
      expect(activities.length).to.equal(0);
      done(err);
    });
  });

});

describe('Activity application with DB - without activities -', function () {

  beforeEach(function (done) { // if this fails, you need to start your mongo DB
    persistence.drop(done);
  });

  it('returns an empty list if there are no activities at all', function (done) {

    activitystore.activitiesForGroupIdsAndRegisteredMemberId([], 'unknownMemberId', true, function (err, activities) {
      expect(err).to.not.exist();
      expect(activities.length).to.equal(0);
      done(err);
    });
  });

});
