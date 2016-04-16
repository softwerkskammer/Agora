/* eslint no-underscore-dangle: 0 */
'use strict';

var moment = require('moment-timezone');

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var _ = require('lodash');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');

var socratesActivitiesService = beans.get('socratesActivitiesService');
var Member = beans.get('member');

var memberstore = beans.get('memberstore');
var notifications = beans.get('socratesNotifications');

var events = beans.get('events');
var e = beans.get('eventConstants');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var RoomsReadModel = beans.get('RoomsReadModel');
var RegistrationReadModel = beans.get('RegistrationReadModel');

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var now = moment.tz();

describe('SoCraTes Activities Service', function () {

  var eventStore;
  var changedResource;

  beforeEach(function () {
    eventStore = new GlobalEventStore();

    sinon.stub(notifications, 'newParticipant');
    sinon.stub(notifications, 'changedDuration');
    changedResource = sinon.spy();
    sinon.stub(notifications, 'changedResource', changedResource);
    sinon.stub(notifications, 'changedWaitinglist');
    sinon.stub(notifications, 'removedFromParticipants');
    sinon.stub(notifications, 'removedFromWaitinglist');

    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      if (nickname === 'nicknameForPair1') { return callback(null, new Member({id: 'memberIdForPair1'})); }
      if (nickname === 'nicknameForPair2') { return callback(null, new Member({id: 'memberIdForPair2'})); }
      callback(null, new Member({id: 'memberId'}));
    });

    sinon.stub(eventstore, 'getEventStore', function (url, callback) {
      callback(null, eventStore);
    });
    sinon.stub(eventstore, 'saveEventStore', function (store, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  function stripTimestamps(someEvents) {
    return _.map(someEvents, function (event) {
      var newEvent = R.clone(event);
      delete newEvent.timestamp;
      return newEvent;
    });
  }

  it('registers the user when he is not on the waitinglist', function (done) {

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', 'single', 2, now, function (err) {
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: undefined, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);
      done(err);
    });
  });

  it('registers the user when he is on the waitinglist', function (done) {
    eventStore.state.registrationEvents = [
      events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)];

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', 'single', 2, now, function (err) {
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
        {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);
      done(err);
    });
  });

  it('registers the user even when the limit is 0', function (done) {
    eventStore.state.socratesEvents = [events.roomQuotaWasSet('single', 0)];
    eventStore.state.registrationEvents = [
      events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)];

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', 'single', 2, now, function (err) {
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
        {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);
      done(err);
    });
  });

  it('registers the user even when the resource is full', function (done) {
    eventStore.state.socratesEvents = [events.roomQuotaWasSet('single', 1)];
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('single', 3, 'otherSessionId', 'otherMemberId', aLongTimeAgo),
      events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', 'single', 2, now, function (err) {
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'otherSessionId', roomType: 'single', memberId: 'otherMemberId', duration: 3, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
        {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);
      done(err);
    });
  });

  it('saves the activity with a new duration for the given member in the given resource', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('single', 2, 'sessionId', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.newDurationFor('nickname', 'single', 4, function (err) {
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.DURATION_WAS_CHANGED, roomType: 'single', memberId: 'memberId', duration: 4, joinedSoCraTes: aLongTimeAgo.valueOf()}]);
      done(err);
    });
  });

  it('moves a member\'s registration to a different resource', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('single', 2, 'sessionId', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.newRoomTypeFor('nickname', 'bed_in_double', function (err) {
      expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.ROOM_TYPE_WAS_CHANGED, roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()}]);
      done(err);
    });
  });

  it('joins two members to form a room', function (done) {

    eventStore.state.registrationEvents = [
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair1', aLongTimeAgo),
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair2', aLongTimeAgo)
    ];

    socratesActivitiesService.addParticipantPairFor('bed_in_double', 'nicknameForPair1', 'nicknameForPair2', function (err) {
      var pairEvents = eventStore.state.roomsEvents;
      expect(pairEvents).to.have.length(1);
      expect(pairEvents[0].participant1Id).to.be('memberIdForPair1');
      expect(pairEvents[0].participant2Id).to.be('memberIdForPair2');
      done(err);
    });
  });

  it('removes a room pair', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair1', aLongTimeAgo),
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair2', aLongTimeAgo)
    ];
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded('bed_in_double', 'memberIdForPair1', 'memberIdForPair2')
    ];

    expect(new RoomsReadModel(eventStore).roomPairsFor('bed_in_double')).to.eql([{ // TODO extract to its own test!
      participant1Id: 'memberIdForPair1',
      participant2Id: 'memberIdForPair2'
    }]);

    socratesActivitiesService.removeParticipantPairFor('bed_in_double', 'nicknameForPair1', 'nicknameForPair2', function (err) {
      expect(new RoomsReadModel(eventStore).roomPairsFor('bed_in_double')).to.eql([]);
      done(err);
    });
  });

  it('removes a participant from the given resource', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.removeParticipantFor('bed_in_double', 'nickname', function (err) {
      expect(R.keys(new RegistrationReadModel(eventStore).participantsByMemberIdFor('bed_in_double'))).to.eql([]);
      done(err);
    });
  });

  it('when removing a participant, also removes him from his room pair', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair1', aLongTimeAgo),
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair2', aLongTimeAgo)
    ];
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded('bed_in_double', 'memberIdForPair1', 'memberIdForPair2')
    ];

    socratesActivitiesService.removeParticipantFor('bed_in_double', 'nicknameForPair1', function (err) {
      expect(R.keys(new RegistrationReadModel(eventStore).participantsByMemberIdFor('bed_in_double'))).to.eql(['memberIdForPair2']);
      expect(new RoomsReadModel(eventStore).roomPairsFor('bed_in_double')).to.eql([]);
      done(err);
    });
  });

  it('removes a waitinglist member from the given resource', function (done) {
    eventStore.state.registrationEvents = [
      events.waitinglistParticipantWasRegistered('single', 'session-id', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.removeWaitinglistMemberFor('single', 'nickname', function (err) {
      expect(R.keys(new RegistrationReadModel(eventStore).waitinglistParticipantsByMemberIdFor('single'))).to.eql([]);
      done(err);
    });
  });
});
