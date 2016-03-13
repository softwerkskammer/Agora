/* eslint no-underscore-dangle: 0 */
'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');

var socratesActivitiesService = beans.get('socratesActivitiesService');
var activitystore = beans.get('activitystore');
var SoCraTesActivity = beans.get('socratesActivity');
var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var notifications = beans.get('socratesNotifications');

var events = beans.get('events');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var RoomsWriteModel = beans.get('RoomsWriteModel');
var RoomsCommandProcessor = beans.get('RoomsCommandProcessor');

describe('SoCraTes Activities Service', function () {

  var eventStore;
  var savedEventStore;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
  });


  var socrates;
  var socratesActivity;
  var registrationTuple;
  var savedActivity;
  var subscriber;

  beforeEach(function () {
    /*eslint camelcase: 0*/
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
      owner: {nickname: 'ownerNick'},
      assignedGroup: 'assignedGroup',
      group: {groupLongName: 'longName'},
      resources: {
        single: {_canUnsubscribe: false, _limit: 10, _registrationOpen: true},
        bed_in_double: {_canUnsubscribe: false, _limit: 10, _registrationOpen: true}
      }
    };

    socratesActivity = new SoCraTesActivity(socrates);

    sinon.stub(notifications, 'newParticipant');
    sinon.stub(notifications, 'changedDuration');
    sinon.stub(notifications, 'changedResource');
    sinon.stub(notifications, 'changedWaitinglist');
    sinon.stub(notifications, 'removedFromParticipants');
    sinon.stub(notifications, 'removedFromWaitinglist');
    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      if (nickname === 'nicknameForPair1') { return callback(null, new Member({id: 'memberIdForPair1'})); }
      if (nickname === 'nicknameForPair2') { return callback(null, new Member({id: 'memberIdForPair2'})); }
      callback(null, new Member({id: 'memberId'}));
    });
    sinon.stub(memberstore, 'getMembersForIds', function (ids, callback) {
      callback(null, _.map(ids, function (id) { return new Member({id: id}); }));
    });
    sinon.stub(subscriberstore, 'allSubscribers', function (callback) {
      callback(null, [subscriber]);
    });
    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      if (url === 'wrongUrl') {
        return callback(new Error('Wrong URL!'));
      }
      callback(null, socratesActivity);
    });

    sinon.stub(eventstore, 'getEventStore', function (url, callback) {
      if (url === 'wrongUrl') {
        return callback(new Error('Wrong URL!'));
      }
      callback(null, eventStore);
    });

    savedActivity = undefined;
    sinon.stub(activitystore, 'saveActivity', function (activity, callback) {
      savedActivity = activity;
      callback();
    });

    savedEventStore = undefined;
    sinon.stub(eventstore, 'saveEventStore', function (store, callback) {
      savedEventStore = store;
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

  it('moves a member\'s registration to a different resource', function (done) {
    socrates.resources.single._registeredMembers = [{memberId: 'memberId', duration: 2}];
    expect(socratesActivity.resourceNamed('single').isAlreadyRegistered('memberId')).to.be(true);

    socratesActivitiesService.newResourceFor('nickname', 'single', 'bed_in_double', function (err) {
      expect(savedActivity.resourceNamed('single').isAlreadyRegistered('memberId')).to.be(false);
      expect(savedActivity.resourceNamed('bed_in_double').isAlreadyRegistered('memberId')).to.be(true);
      done(err);
    });
  });

  it('moves a member\'s waitinglist reservation to a different resource', function (done) {
    socrates.resources.single._waitinglist = [{_memberId: 'memberId'}];
    socrates.resources.bed_in_double._waitinglist = [];
    expect(socratesActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.exist();
    expect(socratesActivity.resourceNamed('bed_in_double').waitinglistEntryFor('memberId')).to.not.exist();

    socratesActivitiesService.newWaitinglistFor('nickname', 'single', 'bed_in_double', function (err) {
      expect(savedActivity.resourceNamed('single').waitinglistEntryFor('memberId')).to.not.exist();
      expect(savedActivity.resourceNamed('bed_in_double').waitinglistEntryFor('memberId')).to.exist();
      done(err);
    });
  });

  it('joins two members to form a room', function (done) {

    eventStore.state.registrationEvents = [
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair1'),
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair2')
    ];

    socratesActivitiesService.newParticipantPairFor('bed_in_double', 'nicknameForPair1', 'nicknameForPair2', function (err) {
      var pairs = eventStore.state.roomsEvents;
      expect(pairs).to.have.length(1);
      expect(pairs[0].participant1Id).to.be('memberIdForPair1');
      expect(pairs[0].participant2Id).to.be('memberIdForPair2');
      done(err);
    });
  });

  it('removes a room pair', function (done) {
    var allKnownMembersForRoomPairing = [new Member({id: 'memberIdForPair1'}), new Member({id: 'memberIdForPair2'})];
    socrates.resources.bed_in_double._registeredMembers = [
      {memberId: 'memberIdForPair1', duration: 2},
      {memberId: 'memberIdForPair2', duration: 2}
    ];
    socrates.resources.bed_in_double.rooms = [{participant1: 'memberIdForPair1', participant2: 'memberIdForPair2'}];
    expect(socratesActivity.rooms('bed_in_double').roomPairsWithMembersFrom(allKnownMembersForRoomPairing)).to.have.length(1);

    socratesActivitiesService.removeParticipantPairFor('bed_in_double', 'nicknameForPair1', 'nicknameForPair2', function (err) {
      expect(savedActivity.rooms('bed_in_double').roomPairsWithMembersFrom(allKnownMembersForRoomPairing)).to.have.length(0);
      done(err);
    });
  });

  it('removes a participant from the given resource', function (done) {
    socrates.resources.single._registeredMembers = [{memberId: 'memberId', duration: 2}];
    expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql(['memberId']);

    socratesActivitiesService.removeParticipantFor('single', 'nickname', function (err) {
      expect(savedActivity.resourceNamed('single').registeredMembers()).to.be.empty();
      done(err);
    });
  });

  it('when removing a participant, also removes him from his room pair', function (done) {
    var allKnownMembersForRoomPairing = [new Member({id: 'memberIdForPair1'}), new Member({id: 'memberIdForPair2'})];
    socrates.resources.bed_in_double._registeredMembers = [
      {memberId: 'memberIdForPair1', duration: 2},
      {memberId: 'memberIdForPair2', duration: 2}
    ];
    socrates.resources.bed_in_double.rooms = [{participant1: 'memberIdForPair1', participant2: 'memberIdForPair2'}];
    expect(socratesActivity.rooms('bed_in_double').roomPairsWithMembersFrom(allKnownMembersForRoomPairing)).to.have.length(1);

    socratesActivitiesService.removeParticipantFor('bed_in_double', 'nicknameForPair1', function (err) {
      expect(savedActivity.resourceNamed('bed_in_double').registeredMembers()).to.eql(['memberIdForPair2']);
      expect(savedActivity.rooms('bed_in_double').roomPairsWithMembersFrom(allKnownMembersForRoomPairing)).to.be.empty();
      done(err);
    });
  });

  it('removes a waitinglist member from the given resource', function (done) {
    socrates.resources.single._waitinglist = [{_memberId: 'memberId'}];
    expect(socratesActivity.resourceNamed('single').waitinglistEntries()[0].registrantId()).to.eql('memberId');

    socratesActivitiesService.removeWaitinglistMemberFor('single', 'nickname', function (err) {
      expect(savedActivity.resourceNamed('single').waitinglistEntries()).to.be.empty();
      done(err);
    });
  });

  it('loads an activity enriched with participants and their participation information for a year', function (done) {
    socrates.resources.single._registeredMembers = [{memberId: 'memberId', duration: 2}];
    subscriber = new Subscriber({id: 'memberId'});
    subscriber.participationOf('2020').state.roommate = 'My buddy';

    expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql(['memberId']);

    socratesActivitiesService.getActivityWithParticipantsAndSubscribers('2020', function (err, activity) {
      expect(activity.participants).to.have.length(1);
      expect(activity.participants[0].participation.roommate()).to.be('My buddy');
      done(err);
    });
  });

  describe('checking participation of a subscriber', function () {
    it('tells that a subscriber participated in a previous SoCraTes', function (done) {
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId', function (groups, memberId, upcoming, callback) {
        if (upcoming) { return callback(null, []); }
        callback(null, [{state: {isSoCraTes: true}}, {state: {isSoCraTes: false}}]);
      });

      socratesActivitiesService.participationStatus(new Subscriber({id: 'memberId'}), function (err, result) {
        expect(result).to.be.true();
        done(err);
      });
    });

    it('tells that a subscriber will participate in an upcoming SoCraTes', function (done) {
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId', function (groups, memberId, upcoming, callback) {
        if (!upcoming) { return callback(null, []); }
        callback(null, [{state: {isSoCraTes: true}}, {state: {isSoCraTes: false}}]);
      });

      socratesActivitiesService.participationStatus(new Subscriber({id: 'memberId'}), function (err, result) {
        expect(result).to.be.true();
        done(err);
      });
    });

    it('tells that a subscriber did not and will not participate in any SoCraTes', function (done) {
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId', function (groups, memberId, upcoming, callback) {
        callback(null, [{state: {isSoCraTes: false}}]);
      });

      socratesActivitiesService.participationStatus(new Subscriber({id: 'memberId'}), function (err, result) {
        expect(result).to.be.false();
        done(err);
      });
    });
  });
});
