/* eslint no-underscore-dangle: 0 */
'use strict';

var moment = require('moment-timezone');

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var _ = require('lodash');
var R = require('ramda');

const config = require('../../testutil/configureForTest');
var beans = config.get('beans');
const cache = config.get('cache');

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
var SoCraTesReadModel = beans.get('SoCraTesReadModel');
var socratesConstants = beans.get('socratesConstants');

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');
var now = moment.tz();

describe('SoCraTes Activities Service', function () {

  var eventStore;
  var changedResource;
  var saveEventStore;

  beforeEach(function () {
    cache.flushAll();

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
      const newStore = new GlobalEventStore();
      newStore.state = Object.assign({}, eventStore.state);
      callback(null, newStore);
    });
    saveEventStore = sinon.stub(eventstore, 'saveEventStore', function (store, callback) { callback(); });
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
      expect(stripTimestamps(saveEventStore.firstCall.args[0].state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: undefined, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);
      done(err);
    });
  });

  it('registers the user when he is on the waitinglist, updates the registration read model and saves the eventstore', function (done) {
    eventStore.state.registrationEvents = [
      events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)];

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', 'single', 2, now, function (err) {
      expect(stripTimestamps(saveEventStore.firstCall.args[0].state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
        {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);

      const readModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
      expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(1);

      done(err);
    });
  });

  it('registers the user even when the limit is 0', function (done) {
    eventStore.state.socratesEvents = [events.roomQuotaWasSet('single', 0)];
    eventStore.state.registrationEvents = [
      events.waitinglistParticipantWasRegistered(['single'], 'sessionId', 'memberId', aLongTimeAgo)];

    socratesActivitiesService.fromWaitinglistToParticipant('nickname', 'single', 2, now, function (err) {
      expect(stripTimestamps(saveEventStore.firstCall.args[0].state.registrationEvents)).to.eql([
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
      expect(stripTimestamps(saveEventStore.firstCall.args[0].state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'otherSessionId', roomType: 'single', memberId: 'otherMemberId', duration: 3, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
        {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);
      done(err);
    });
  });

  it('saves the activity with a new duration for the given member in the given resource and updates the event store and the read model', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('single', 2, 'sessionId', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.newDurationFor('nickname', 'single', 4, function (err) {
      expect(stripTimestamps(saveEventStore.firstCall.args[0].state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.DURATION_WAS_CHANGED, roomType: 'single', memberId: 'memberId', duration: 4, joinedSoCraTes: aLongTimeAgo.valueOf()}]);

      const readModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
      expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(1);
      expect(readModel.reservationsAndParticipantsFor('single')[0].duration).to.eql(4);
      done(err);
    });
  });

  it('moves a member\'s registration to a different resource and updates event store and read model', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('single', 2, 'sessionId', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.newRoomTypeFor('nickname', 'bed_in_double', function (err) {
      expect(stripTimestamps(saveEventStore.firstCall.args[0].state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.ROOM_TYPE_WAS_CHANGED, roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()}]);

      const readModel = cache.get(socratesConstants.currentUrl + '_registrationReadModel');
      expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(0);
      expect(readModel.reservationsAndParticipantsFor('bed_in_double')).to.have.length(1);
      done(err);
    });
  });

  it('joins two members to form a room', function (done) {

    eventStore.state.registrationEvents = [
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair1', aLongTimeAgo),
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberIdForPair2', aLongTimeAgo)
    ];

    socratesActivitiesService.addParticipantPairFor('bed_in_double', 'nicknameForPair1', 'nicknameForPair2', function (err) {
      var pairEvents = saveEventStore.firstCall.args[0].state.roomsEvents;
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

    expect(new RoomsReadModel(eventStore, new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore))).roomPairsFor('bed_in_double')).to.eql([{ // TODO extract to its own test!
      participant1Id: 'memberIdForPair1',
      participant2Id: 'memberIdForPair2'
    }]);

    socratesActivitiesService.removeParticipantPairFor('bed_in_double', 'nicknameForPair1', 'nicknameForPair2', function (err) {
      const savedEventStore = saveEventStore.firstCall.args[0];
      expect(stripTimestamps(savedEventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberIdForPair1', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberIdForPair2', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()}
      ]);
      expect(stripTimestamps(savedEventStore.state.roomsEvents)).to.eql([
        {event: e.ROOM_PAIR_WAS_ADDED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'},
        {event: e.ROOM_PAIR_WAS_REMOVED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'}
      ]);

      //      expect(new RoomsReadModel(eventStore, new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore))).roomPairsFor('bed_in_double')).to.eql([]);
      done(err);
    });
  });

  it('removes a participant from the given resource', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('bed_in_double', 2, 'session-id', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.removeParticipantFor('bed_in_double', 'nickname', function (err) {
      const savedEventStore = saveEventStore.firstCall.args[0];
      expect(stripTimestamps(savedEventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberId: 'memberId'}
      ]);
      expect(stripTimestamps(savedEventStore.state.roomsEvents)).to.eql([]);
      //      expect(R.keys(new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore)).participantsByMemberIdFor('bed_in_double'))).to.eql([]);
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
      const savedEventStore = saveEventStore.firstCall.args[0];
      expect(stripTimestamps(savedEventStore.state.registrationEvents)).to.eql([
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberIdForPair1', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', roomType: 'bed_in_double', memberId: 'memberIdForPair2', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
        {event: e.PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberId: 'memberIdForPair1'}
      ]);
      expect(stripTimestamps(savedEventStore.state.roomsEvents)).to.eql([
        {event: e.ROOM_PAIR_WAS_ADDED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'},
        {event: e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberIdToBeRemoved: 'memberIdForPair1', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'}
      ]);

      // TODO test this in read models:
      //      expect(R.keys(new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore)).participantsByMemberIdFor('bed_in_double'))).to.eql(['memberIdForPair2']);
      //      expect(new RoomsReadModel(eventStore, new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore))).roomPairsFor('bed_in_double')).to.eql([]);
      done(err);
    });
  });

  it('removes a waitinglist member from the given resource', function (done) {
    eventStore.state.registrationEvents = [
      events.waitinglistParticipantWasRegistered(['single'], 'session-id', 'memberId', aLongTimeAgo)
    ];

    socratesActivitiesService.removeWaitinglistMemberFor(['single'], 'nickname', function (err) {
      const savedEventStore = saveEventStore.firstCall.args[0];
      expect(stripTimestamps(savedEventStore.state.registrationEvents)).to.eql([
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
        {event: e.WAITINGLIST_PARTICIPANT_WAS_REMOVED, desiredRoomTypes: ['single'], memberId: 'memberId'}
      ]);
      expect(stripTimestamps(savedEventStore.state.roomsEvents)).to.eql([]);
      //      expect(R.keys(new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore)).waitinglistParticipantsByMemberIdFor('single'))).to.eql([]);
      done(err);
    });
  });
});
