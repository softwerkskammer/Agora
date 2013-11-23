"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

//var util = require('util');

var conf = require('../configureForTest');

var Activity = conf.get('beans').get('activity');
var dummyActivity = new Activity({title: 'Title of the Activity', description: 'description', assignedGroup: 'assignedGroup',
  location: 'location', direction: 'direction', startDate: '01.01.2013', url: 'urlOfTheActivity', color: 'aus Gruppe' });

var activitiesAPI = conf.get('beans').get('activitiesAPI');

var activitiesCoreAPI = conf.get('beans').get('activitiesCoreAPI');
var groupsAPI = conf.get('beans').get('groupsAPI');
var membersAPI = conf.get('beans').get('membersAPI');

var fieldHelpers = conf.get('beans').get('fieldHelpers');
var Activity = conf.get('beans').get('activity');
var Member = conf.get('beans').get('member');
var Group = conf.get('beans').get('group');

var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlOfTheActivity',
  owner: 'ownerId'});

var group = new Group({id: "groupname", longName: "Buxtehude"});


describe('Activities API', function () {

  beforeEach(function (done) {
    sinon.stub(activitiesCoreAPI, 'allActivities', function (callback) {callback(null, [dummyActivity]); });

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
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('returns the queried activities and enhances them with their color and group name', function () {
    activitiesAPI.getActivitiesForDisplay(activitiesCoreAPI.allActivities, function (err, activities) {
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
    sinon.stub(activitiesCoreAPI, 'getActivity', function (activityId, callback) { callback(null, emptyActivity); });
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
      expect(activity.visitors.length).to.equal(2);
      expect(activity.visitors, "Visitors").to.contain(member1);
      expect(activity.visitors, "Visitors").to.contain(member2);
      expect(activity.ownerNickname, "Owner").to.equal('owner');
      done(err);
    });
  });


});
