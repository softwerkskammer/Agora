'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must');
var moment = require('moment-timezone');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');

var socratesActivitiesService = beans.get('socratesActivitiesService');
var activitystore = beans.get('activitystore');
var SoCraTesActivity = beans.get('socratesActivity');
var Member = beans.get('member');

var membersService = beans.get('membersService');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var memberstore = beans.get('memberstore');
var fieldHelpers = beans.get('fieldHelpers');
var notifications = beans.get('socratesNotifications');

describe('SoCraTes Activities Service', function () {

  var socrates;
  var socratesActivity;
  var registrationTuple;
  var savedActivity;

  beforeEach(function () {
    registrationTuple = {
      activityUrl: 'socrates-url',
      resourceName: 'single',
      duration: 2,
      sessionID: 'sessionId'
    };

    socrates = {
      id: 'socratesId',
      title: 'SoCraTes',
      description: 'Coolest event ever :-)',
      location: 'Right next door',
      url: 'socrates-url',
      isSoCraTes: true,
      startUnix: 1440687600,
      endUnix: 1440946800,
      owner: {nickname: "ownerNick"},
      assignedGroup: "assignedGroup",
      group: {groupLongName: "longName"},
      resources: {
        single: {_canUnsubscribe: false, _limit: 10, _position: 2, _registrationOpen: true}
      }
    };

    socratesActivity = new SoCraTesActivity(socrates);

    sinon.stub(notifications, 'newParticipant');
    sinon.stub(notifications, 'changedDuration');
    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      callback(null, new Member({id: 'memberId'}));
    });
    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      if (url === 'wrongUrl') {
        return callback(new Error('Wrong URL!'));
      }
      callback(null, socratesActivity);
    });

    savedActivity = undefined;
    sinon.stub(activitystore, 'saveActivity', function (activity, callback) {
      savedActivity = activity;
      callback();
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('returns an error if the activity cannot be found', function (done) {
    registrationTuple.activityUrl = 'wrongUrl';

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', registrationTuple, function (err) {
      expect(err).to.exist();
      done();
    });
  });

  it('registers the user when he is not on the waitinglist', function (done) {
    expect(socratesActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.not.exist();

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', registrationTuple, function (err) {
      expect(savedActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.not.exist();
      expect(savedActivity.resourceNamed('single').isAlreadyRegistered('memberId')).to.be.true();
      done(err);
    });
  });

  it('registers the user when he is on the waitinglist', function (done) {
    socrates.resources.single._waitinglist = [{_memberId: 'memberId'}];
    expect(socratesActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.exist();

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', registrationTuple, function (err) {
      expect(savedActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.not.exist();
      expect(savedActivity.resourceNamed('single').isAlreadyRegistered('memberId')).to.be.true();
      done(err);
    });
  });

  it('registers the user even when the limit is 0', function (done) {
    socrates.resources.single._limit = 0;
    socrates.resources.single._waitinglist = [{_memberId: 'memberId'}];
    expect(socratesActivity.resourceNamed('single').limit()).to.be(0);

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', registrationTuple, function (err) {
      expect(savedActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.not.exist();
      expect(savedActivity.resourceNamed('single').isAlreadyRegistered('memberId')).to.be.true();
      done(err);
    });
  });

  it('registers the user even when the resource is full', function (done) {
    socrates.resources.single._limit = 1;
    socrates.resources.single._registeredMembers = [{memberId: 'otherId'}];
    socrates.resources.single._waitinglist = [{_memberId: 'memberId'}];
    expect(socratesActivity.resourceNamed('single').isFull()).to.be.true();

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', registrationTuple, function (err) {
      expect(savedActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.not.exist();
      expect(savedActivity.resourceNamed('single').isAlreadyRegistered('memberId')).to.be.true();
      done(err);
    });
  });

  it('registers the user even when the resource is not open for registration', function (done) {
    socrates.resources.single._registrationOpen = false;
    expect(socratesActivity.resourceNamed('single').isRegistrationOpen()).to.be.false();

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', registrationTuple, function (err) {
      expect(savedActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.not.exist();
      expect(savedActivity.resourceNamed('single').isAlreadyRegistered('memberId')).to.be.true();
      done(err);
    });
  });

  it('saves the activity with a new duration for the given member in the given resource', function (done) {
    socrates.resources.single._registeredMembers = [{memberId: 'memberId', duration: 2}];
    expect(socratesActivity.socratesResourceNamed('single').recordFor('memberId').duration).to.be(2);

    socratesActivitiesService.newDurationFor('nickname', 'single', 4, function (err) {
      expect(savedActivity.socratesResourceNamed('single').recordFor('memberId').duration).to.be(4);
      done(err);
    });
  });
});
