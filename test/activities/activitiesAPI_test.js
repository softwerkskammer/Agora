"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;
var moment = require('moment-timezone');

//var util = require('util');

var beans = require('../configureForTest').get('beans');

var activitiesAPI = beans.get('activitiesAPI');
var activitystore = beans.get('activitystore');
var groupsAPI = beans.get('groupsAPI');
var membersAPI = beans.get('membersAPI');

var fieldHelpers = beans.get('fieldHelpers');
var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');

var dummyActivity = new Activity({title: 'Title of the Activity', description: 'description', assignedGroup: 'assignedGroup',
  location: 'location', direction: 'direction', startDate: '01.01.2013', url: 'urlOfTheActivity', color: 'aus Gruppe' });

var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlOfTheActivity',
  owner: 'ownerId'});

var group = new Group({id: "groupname", longName: "Buxtehude"});


describe('Activities API', function () {

  beforeEach(function () {
    sinon.stub(activitystore, 'allActivities', function (callback) {callback(null, [dummyActivity]); });

    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) {
      callback(null, [
        {id: 'assignedGroup', longName: 'The name of the assigned Group'}
      ]);
    });
    sinon.stub(groupsAPI, 'allGroupColors', function (callback) {
      var result = {};
      result['assignedGroup'] = '#123456';
      callback(null, result);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('returns the queried activities and enhances them with their color and group name', function () {
    activitiesAPI.getActivitiesForDisplay(activitystore.allActivities, function (err, activities) {
      expect(!!err).to.be.false;
      expect(activities.length).to.equal(1);
      var activity = activities[0];
      expect(activity.title()).to.equal('Title of the Activity');
      expect(activity.colorRGB).to.equal('#123456');
      expect(activity.groupName()).to.equal('The name of the assigned Group');
    });
  });

  it('returns an activity and enhances it with its group and visitors', function (done) {
    var member1 = new Member({id: 'memberId1', nickname: 'participant1', email: "a@b.c"});
    var member2 = new Member({id: 'memberId2', nickname: 'participant2', email: "a@b.c"});
    var owner = new Member({id: 'ownerId', nickname: 'owner', email: "a@b.c"});
    sinon.stub(activitystore, 'getActivity', function (activityId, callback) { callback(null, emptyActivity); });
    sinon.stub(membersAPI, 'getMembersForIds', function (ids, callback) {
      callback(null, [ member1, member2 ]);
    });
    sinon.stub(membersAPI, 'getMemberForId', function (id, callback) {
      callback(null, owner);
    });
    sinon.stub(groupsAPI, 'getGroup', function (groupname, callback) {
      if (groupname === 'groupname') {
        return callback(null, group);
      }
      return callback(null, null);
    });

    activitiesAPI.getActivityWithGroupAndParticipants('urlOfTheActivity', function (err, activity) {
      expect(!!activity, "Activity").to.be.true;
      expect(activity.group, "Group").to.equal(group);
      expect(activity.participants.length).to.equal(2);
      expect(activity.participants, "Participants").to.contain(member1);
      expect(activity.participants, "Participants").to.contain(member2);
      expect(activity.ownerNickname, "Owner").to.equal('owner');
      done(err);
    });
  });

  describe('checks the validity of URLs and', function () {
    it('does not allow the URL \'edit\'', function (done) {
      activitiesAPI.isValidUrl("edit", "^edit$", function (err, result) {
        expect(result).to.be.false;
        done(err);
      });
    });
    it('allows the untrimmed URL \' edit \'', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, null); });
      activitiesAPI.isValidUrl(" edit ", "^edit$", function (err, result) {
        expect(result).to.be.true;
        done(err);
      });
    });
  });

  describe('- when adding a visitor -', function () {

    it('succeeds when registration is open', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: true}}});
      sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null); });
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'getActivityForId', function (id, callback) { callback(null, activity); });

      activitiesAPI.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, statusTitle, statusText) {
        expect(!!statusTitle, "Status Title").to.be.false;
        expect(!!statusText, "Status Text").to.be.false;
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberId');
        done(err);
      });
    });

    it('gives a status message when registration is not open', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: {_registrationOpen: false}}});

      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'getActivityForId', function (id, callback) { callback(null, activity); });

      activitiesAPI.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err, statusTitle, statusText) {
        expect(statusTitle, "Status Title").to.equal('activities.registration_not_now');
        expect(statusText, "Status Text").to.equal('activities.registration_not_possible');
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.not.contain('memberId');
        done(err);
      });
    });

    it('succeeds when registration is not open but registrant is on waiting list and allowed to subscribe', function (done) {
      var tomorrow = moment();
      tomorrow.add('days', 1);
      var activity = new Activity({ resources: { Einzelzimmer: { _registrationOpen: false, _waitinglist: [{ _memberId: 'memberId', _registrationValidUntil: tomorrow.toDate() }] } } });
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
      sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null); });

      activitiesAPI.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(!!statusTitle, "Status Title").to.be.false;
        expect(!!statusText, "Status Text").to.be.false;
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberId');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error("error")); });

      activitiesAPI.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', new moment(), function (err) {
        expect(!!err, "Error").to.be.true;
        done(); // error condition - do not pass err
      });
    });
  });

});
