'use strict';

var chado = require('chado');
var cb = chado.callback;
var verify = chado.verify;

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var moment = require('moment-timezone');
var _ = require('lodash');

//var util = require('util');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var reservedURLs = conf.get('reservedActivityURLs');

var activitiesService = beans.get('activitiesService');
var activitystore = beans.get('activitystore');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var memberstore = beans.get('memberstore');
var membersService = beans.get('membersService');

var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');
var notifications = beans.get('notifications');

var dummyActivity = new Activity({
  title: 'Title of the Activity',
  description: 'description',
  assignedGroup: 'assignedGroup',
  location: 'location',
  direction: 'direction',
  startDate: '01.01.2013',
  url: 'urlOfTheActivity',
  color: 'aus Gruppe'
});

var group = new Group({id: 'groupname', longName: 'Buxtehude'});

var waitinglistMembersOf = function (activity, resourceName) {
  return _.map(_.map(activity.resourceNamed(resourceName).waitinglistEntries(), 'state'), '_memberId');
};

var activityWithEinzelzimmer = function (ressource) {
  var state = {resources: {Einzelzimmer: ressource}};
  var activity = new Activity(state);
  sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null); });
  sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
  sinon.stub(activitystore, 'getActivityForId', function (id, callback) { callback(null, activity); });
  return activity;
};

describe('Activities Service', function () {

  beforeEach(function () {
    //sinon.stub(membersService, 'getImage', function(member, callback) { callback(); });

    sinon.stub(activitystore, 'allActivities', function (callback) {callback(null, [dummyActivity]); });

    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) {
      callback(null, [
        {id: 'assignedGroup', longName: 'The name of the assigned Group'}
      ]);
    });
    sinon.stub(groupsService, 'allGroupColors', function (callback) {
      var result = {};
      result.assignedGroup = '#123456';
      callback(null, result);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('returns the queried activities and enhances them with their color and group name', function () {
    activitiesService.getActivitiesForDisplay(activitystore.allActivities, function (err, activities) {
      expect(err).to.not.exist();
      expect(activities.length).to.equal(1);
      var activity = activities[0];
      expect(activity.title()).to.equal('Title of the Activity');
      expect(activity.colorRGB).to.equal('#123456');
      expect(activity.groupName()).to.equal('The name of the assigned Group');
    });
  });

  it('returns an activity and enhances it with its group and visitors', function (done) {
    var member1 = new Member({
      id: 'memberId1',
      nickname: 'participant1',
      email: 'nick1@b.c',
      firstname: 'Firstname1',
      lastname: 'Lastname1'
    });
    var member2 = new Member({
      id: 'memberId2',
      nickname: 'participant2',
      email: 'nick2@b.c',
      firstname: 'Firstname2',
      lastname: 'Lastname2'
    });
    var owner = new Member({id: 'ownerId', nickname: 'owner', email: 'a@b.c'});

    var emptyActivity = new Activity({
      title: 'Title of the Activity',
      url: 'urlOfTheActivity',
      assignedGroup: 'groupname',
      owner: 'ownerId'
    });

    sinon.stub(activitystore, 'getActivity', function (activityId, callback) { callback(null, emptyActivity); });
    sinon.stub(memberstore, 'getMembersForIds', function (ids, callback) {
      var memberA = new Member({
        id: 'memberId1',
        nickname: 'participant1',
        email: 'nick1@b.c',
        firstname: 'Firstname1',
        lastname: 'Lastname1'
      });
      var memberB = new Member({
        id: 'memberId2',
        nickname: 'participant2',
        email: 'nick2@b.c',
        firstname: 'Firstname2',
        lastname: 'Lastname2'
      });

      callback(null, [memberA, memberB]);
    });
    sinon.stub(membersService, 'putAvatarIntoMemberAndSave', function (member, callback) {callback();});
    sinon.stub(memberstore, 'getMemberForId', function (id, callback) {
      callback(null, owner);
    });
    sinon.stub(groupstore, 'getGroup', function (groupname, callback) {
      if (groupname === 'groupname') {
        return callback(null, group);
      }
      return callback(null, null);
    });

    var expectedActivity = new Activity({
      title: 'Title of the Activity',
      url: 'urlOfTheActivity',
      assignedGroup: 'groupname',
      owner: 'ownerId'
    });

    // following are the expected enrichements of the activity
    expectedActivity.group = group;
    expectedActivity.participants = [member1, member2];
    expectedActivity.ownerNickname = 'owner';

    verify('activitiesService')
      .canHandle('getActivityWithGroupAndParticipants')
      .withArgs('urlOfTheActivity', cb)
      .andCallsCallbackWith(null, expectedActivity)
      .on(activitiesService, done);
  });

  describe('checks the validity of URLs and', function () {

    it('does not allow the URL \'edit\'', function (done) {
      verify('activitiesService')
        .canHandle('isValidUrl')
        .withArgs(reservedURLs, 'edit', cb)
        .andCallsCallbackWith(null, false)
        .on(activitiesService, done);
    });

    it('allows the untrimmed URL \'uhu\'', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, null); });
      verify('activitiesService')
        .canHandle('isValidUrl')
        .withArgs(reservedURLs, 'uhu', cb)
        .andCallsCallbackWith(null, true)
        .on(activitiesService, done);
    });

    it('does not allow a URL containing a "/"', function (done) {
      verify('activitiesService')
        .canHandle('isValidUrl')
        .withArgs(reservedURLs, 'legal/egal', cb)
        .andCallsCallbackWith(null, false)
        .on(activitiesService, done);
    });
  });

  describe('- when adding a visitor -', function () {

    beforeEach(function () {
      sinon.stub(activitystore, 'saveActivity', function (id, callback) { callback(null); });
      sinon.stub(notifications, 'visitorRegistration');
    });

    function activityWithAddMemberIdReturning(truthValue) {
      return {resourceNamed: function () { return {addMemberId: function () { return truthValue; }}; }};
    }

    it('does not show a status message when member addition succeeds', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activityWithAddMemberIdReturning(true)); });

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

    it('shows a status message when member addition fails', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activityWithAddMemberIdReturning(false)); });

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('activities.registration_not_now');
        expect(statusText).to.be('activities.registration_not_possible');
        done(err);
      });
    });

    it('notifies of the registration when member addition succeeds', function (done) {
      var activity = activityWithAddMemberIdReturning(true);
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(notifications.visitorRegistration.calledOnce).to.be(true);
        expect(notifications.visitorRegistration.firstCall.args[0]).to.eql(activity);
        expect(notifications.visitorRegistration.firstCall.args[1]).to.equal('memberId');
        expect(notifications.visitorRegistration.firstCall.args[2]).to.equal('Einzelzimmer');
        done(err);
      });
    });

    it('does not notify of the registration when member addition fails', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activityWithAddMemberIdReturning(false)); });

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(notifications.visitorRegistration.called).to.be(false);
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });

      activitiesService.addVisitorTo('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(err).to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

  describe('- when removing a visitor -', function () {

    it('succeeds when registration is open', function (done) {
      var activity = activityWithEinzelzimmer({
        _registrationOpen: true,
        _registeredMembers: [
          {memberId: 'memberId'},
          {memberId: 'otherId'}
        ]
      });
      sinon.stub(notifications, 'visitorUnregistration');

      activitiesService.removeVisitorFrom('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.not.contain('memberId');
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('otherId');
        done(err);
      });
    });

    it('succeeds when registration is not open', function (done) {
      var activity = activityWithEinzelzimmer({
        _registrationOpen: false,
        _registeredMembers: [
          {memberId: 'memberId'},
          {memberId: 'otherId'}
        ]
      });
      sinon.stub(notifications, 'visitorUnregistration');

      activitiesService.removeVisitorFrom('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.not.contain('memberId');
        expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('otherId');
        done(err);
      });
    });

    it('notifies of the unregistration', function (done) {
      var activity = activityWithEinzelzimmer({
        _registrationOpen: true,
        _registeredMembers: [
          {memberId: 'memberId'},
          {memberId: 'otherId'}
        ]
      });
      sinon.stub(notifications, 'visitorUnregistration');

      activitiesService.removeVisitorFrom('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(notifications.visitorUnregistration.calledOnce).to.be(true);
        expect(notifications.visitorUnregistration.firstCall.args[0]).to.eql(activity);
        expect(notifications.visitorUnregistration.firstCall.args[1]).to.equal('memberId');
        expect(notifications.visitorUnregistration.firstCall.args[2]).to.equal('Einzelzimmer');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });

      activitiesService.removeVisitorFrom('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

  describe('- when adding somebody to the waitinglist -', function () {

    it('succeeds when resource has a waitinglist', function (done) {
      var activity = activityWithEinzelzimmer({_waitinglist: []});
      sinon.stub(notifications, 'waitinglistAddition');

      activitiesService.addToWaitinglist('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle, 'Status Title').to.not.exist();
        expect(statusText, 'Status Text').to.not.exist();
        var waitinglistMembers = waitinglistMembersOf(activity, 'Einzelzimmer');
        expect(waitinglistMembers).to.contain('memberId');
        done(err);
      });
    });

    it('notifies of the waitinglist addition', function (done) {
      var activity = activityWithEinzelzimmer({_waitinglist: []});
      sinon.stub(notifications, 'waitinglistAddition');

      activitiesService.addToWaitinglist('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(notifications.waitinglistAddition.calledOnce).to.be(true);
        expect(notifications.waitinglistAddition.firstCall.args[0]).to.eql(activity);
        expect(notifications.waitinglistAddition.firstCall.args[1]).to.equal('memberId');
        expect(notifications.waitinglistAddition.firstCall.args[2]).to.equal('Einzelzimmer');
        done(err);
      });
    });

    it('gives a status message when there is no waitinglist', function (done) {
      var activity = activityWithEinzelzimmer({});

      activitiesService.addToWaitinglist('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err, statusTitle, statusText) {
        expect(statusTitle, 'Status Title').to.equal('activities.waitinglist_not_possible');
        expect(statusText, 'Status Text').to.equal('activities.no_waitinglist');
        var waitinglistMembers = waitinglistMembersOf(activity, 'Einzelzimmer');
        expect(waitinglistMembers).to.not.contain('memberId');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });

      activitiesService.addToWaitinglist('memberId', 'activity-url', 'Einzelzimmer', moment(), function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

  describe('- when removing a waitinglist member -', function () {

    it('succeeds no matter whether registration is open or not', function (done) {
      var activity = activityWithEinzelzimmer({
        _waitinglist: [
          {_memberId: 'memberId'},
          {_memberId: 'otherId'}
        ]
      });
      sinon.stub(notifications, 'waitinglistRemoval');

      activitiesService.removeFromWaitinglist('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        var waitinglistMembers = waitinglistMembersOf(activity, 'Einzelzimmer');
        expect(waitinglistMembers).to.not.contain('memberId');
        expect(waitinglistMembers).to.contain('otherId');
        done(err);
      });
    });

    it('notifies of the waitinglist removal', function (done) {
      var activity = activityWithEinzelzimmer({
        _registrationOpen: true,
        _registeredMembers: [
          {memberId: 'memberId'},
          {memberId: 'otherId'}
        ]
      });
      sinon.stub(notifications, 'waitinglistRemoval');

      activitiesService.removeFromWaitinglist('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(notifications.waitinglistRemoval.calledOnce).to.be(true);
        expect(notifications.waitinglistRemoval.firstCall.args[0]).to.eql(activity);
        expect(notifications.waitinglistRemoval.firstCall.args[1]).to.equal('memberId');
        expect(notifications.waitinglistRemoval.firstCall.args[2]).to.equal('Einzelzimmer');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });

      activitiesService.removeFromWaitinglist('memberId', 'activity-url', 'Einzelzimmer', function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

});
