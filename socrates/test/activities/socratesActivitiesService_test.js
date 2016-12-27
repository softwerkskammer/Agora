/* eslint no-underscore-dangle: 0 */
'use strict';

const moment = require('moment-timezone');

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');
const R = require('ramda');

const config = require('../../testutil/configureForTest');
const beans = config.get('beans');
const cache = config.get('cache');

const socratesActivitiesService = beans.get('socratesActivitiesService');
const Member = beans.get('member');

const memberstore = beans.get('memberstore');
const notifications = beans.get('socratesNotifications');

const events = beans.get('events');
const e = beans.get('eventConstants');
const eventstore = beans.get('eventstore');
const GlobalEventStore = beans.get('GlobalEventStore');
const RoomsReadModel = beans.get('RoomsReadModel');
const RegistrationReadModel = beans.get('RegistrationReadModel');
const socratesConstants = beans.get('socratesConstants');

const transport = beans.get('mailtransport').transport;

const aLongTimeAgo = moment.tz().subtract(40, 'minutes');
const now = moment.tz();

describe('SoCraTes Activities Service', () => {

  let listOfEvents;
  let changedResource;
  let saveEventStore;

  let newParticipantNotification;
  let changedDurationNotification;
  let changedRoomTypeNotification;
  let changedWaitinglistNotification;
  let removedFromParticipantsNotification;
  let removedFromWaitinglistNotification;

  beforeEach(() => {
    sinon.stub(transport, 'sendMail');
    cache.flushAll();

    listOfEvents = [];

    newParticipantNotification = sinon.stub(notifications, 'newParticipant');
    changedDurationNotification = sinon.stub(notifications, 'changedDuration');
    changedResource = sinon.spy();
    changedRoomTypeNotification = sinon.stub(notifications, 'changedResource', changedResource);
    changedWaitinglistNotification = sinon.stub(notifications, 'changedWaitinglist');
    removedFromParticipantsNotification = sinon.stub(notifications, 'removedFromParticipants');
    removedFromWaitinglistNotification = sinon.stub(notifications, 'removedFromWaitinglist');

    sinon.stub(memberstore, 'getMember', (nickname, callback) => {
      if (nickname === 'nicknameForPair1') { return callback(null, new Member({id: 'memberIdForPair1'})); }
      if (nickname === 'nicknameForPair2') { return callback(null, new Member({id: 'memberIdForPair2'})); }
      callback(null, new Member({id: 'memberId'}));
    });

    sinon.stub(eventstore, 'getEventStore', (url, callback) => {
      const newStore = new GlobalEventStore();
      newStore.state.events = listOfEvents;
      callback(null, newStore);
    });
    saveEventStore = sinon.stub(eventstore, 'saveEventStore', (store, callback) => { callback(); });
  });

  afterEach(() => {
    sinon.restore();
  });

  function stripTimestamps(someEvents) {
    return someEvents.map(event => {
      const newEvent = R.clone(event);
      delete newEvent.timestamp;
      return newEvent;
    });
  }

  describe('fromWaitinglistToParticipant', () => {

    it('registers the user when he is on the waitinglist, updates the registration write model and saves the eventstore', done => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered(['single'], 2, 'sessionId', 'memberId', aLongTimeAgo)];

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single'}, now, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);

        expect(newParticipantNotification.called).to.be.true();

        const writeModel = cache.get(socratesConstants.currentUrl + '_registrationWriteModel');
        expect(writeModel.participantEventFor('memberId').roomType).to.eql('single');

        done(err);
      });
    });

    it('does not register the user when he is not on the waitinglist', done => {

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single'}, now, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_BECAUSE_THEY_WERE_NOT_ON_WAITINGLIST, roomType: 'single', memberId: 'memberId'}]);

        expect(newParticipantNotification.called).to.be.false();
        done(err);
      });
    });

    it('registers the user even when the limit is 0', done => {
      listOfEvents = [
        events.roomQuotaWasSet('single', 0),
        events.waitinglistParticipantWasRegistered(['single'], 2, 'sessionId', 'memberId', aLongTimeAgo)];

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single'}, now, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 0},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);

        expect(newParticipantNotification.called).to.be.true();
        done(err);
      });
    });

    it('registers the user even when the resource is full', done => {
      listOfEvents = [
        events.roomQuotaWasSet('single', 1),
        events.registeredParticipantFromWaitinglist('single', 3, 'otherMemberId', aLongTimeAgo),
        events.waitinglistParticipantWasRegistered(['single'], 2, 'sessionId', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single'}, now, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 1},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'otherMemberId', duration: 3, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: now.valueOf()}]);

        expect(newParticipantNotification.called).to.be.true();
        done(err);
      });
    });

    it('does not register the user if he is already registered, even if the room is different', done => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('junior', 3, 'memberId', aLongTimeAgo),
        events.waitinglistParticipantWasRegistered(['single'], 2, 'sessionId', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'single'}, now, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'junior', memberId: 'memberId', duration: 3, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.DID_NOT_REGISTER_PARTICIPANT_FROM_WAITINGLIST_A_SECOND_TIME, roomType: 'single', memberId: 'memberId'}]);

        expect(newParticipantNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not register the user if the nickname is empty', done => {
      socratesActivitiesService.fromWaitinglistToParticipant({nickname: '', roomType: 'single'}, now, err => {
        expect(saveEventStore.called).to.be.false();
        expect(newParticipantNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not register the user if the room type is invalid', done => {
      socratesActivitiesService.fromWaitinglistToParticipant({nickname: 'nickname', roomType: 'unknown'}, now, err => {
        expect(saveEventStore.called).to.be.false();
        expect(newParticipantNotification.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('newDurationFor', () => {

    it('saves the activity with a new duration for the given member in the given resource and updates the event store and the write model', done => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('single', 2, 'memberId', aLongTimeAgo)
      ];

      const params = {nickname: 'nickname', roomType: 'single', duration: 4};
      socratesActivitiesService.newDurationFor(params, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.DURATION_WAS_CHANGED, roomType: 'single', memberId: 'memberId', duration: 4, joinedSoCraTes: aLongTimeAgo.valueOf()}]);

        expect(changedDurationNotification.called).to.be.true();

        const writeModel = cache.get(socratesConstants.currentUrl + '_registrationWriteModel');
        expect(writeModel.participantEventFor('memberId').roomType).to.eql('single');
        done(err);
      });
    });

    it('does not change the duration for a non-participant', done => {
      listOfEvents = [];

      const params = {nickname: 'nickname', roomType: 'single', duration: 4};
      socratesActivitiesService.newDurationFor(params, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT, memberId: 'memberId', duration: 4}]);

        expect(changedDurationNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not change the duration if the nickname is empty', done => {
      socratesActivitiesService.newDurationFor({nickname: '', roomType: 'single', duration: 4}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(changedDurationNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not change the duration if the room type is invalid', done => {
      socratesActivitiesService.newDurationFor({nickname: 'nickname', roomType: 'unknown', duration: 4}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(changedDurationNotification.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

    it('does not change the duration if the duration is invalid', done => {
      socratesActivitiesService.newDurationFor({nickname: 'nickname', roomType: 'single', duration: 0}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(changedDurationNotification.called).to.be.false();
        expect(err.errors).to.eql(['The duration is invalid!']);
        done();
      });
    });
  });

  describe('newRoomTypeFor', () => {

    it('moves a member\'s registration to a different resource and updates event store and write model', done => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('single', 2, 'memberId', aLongTimeAgo)
      ];

      const params = {nickname: 'nickname', newRoomType: 'bed_in_double'};
      socratesActivitiesService.newRoomTypeFor(params, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'single', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.ROOM_TYPE_WAS_CHANGED, roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()}]);

        expect(changedRoomTypeNotification.called).to.be.true();

        const writeModel = cache.get(socratesConstants.currentUrl + '_registrationWriteModel');
        expect(writeModel.participantEventFor('memberId').roomType).to.eql('bed_in_double');
        done(err);
      });
    });

    it('does not change the room type for a non-participant and updates the event store', done => {
      listOfEvents = [];

      const params = {nickname: 'nickname', newRoomType: 'bed_in_double'};
      socratesActivitiesService.newRoomTypeFor(params, err => {
        expect(stripTimestamps(saveEventStore.firstCall.args[0].state.events)).to.eql([
          {event: e.DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, roomType: 'bed_in_double', memberId: 'memberId'}]);

        expect(changedRoomTypeNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not change the room type if the nickname is empty', done => {
      socratesActivitiesService.newRoomTypeFor({nickname: '', newRoomType: 'single'}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(changedRoomTypeNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not change the room type if the room type is invalid', done => {
      socratesActivitiesService.newRoomTypeFor({nickname: 'nickname', newRoomType: 'unknown'}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(changedRoomTypeNotification.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('addParticipantPairFor', () => {

    it('joins two members to form a room, updates the eventstore and the read model', done => {

      listOfEvents = [
        events.registeredParticipantFromWaitinglist('bed_in_double', 2, 'memberIdForPair1', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('bed_in_double', 2, 'memberIdForPair2', aLongTimeAgo)
      ];

      socratesActivitiesService.addParticipantPairFor({roomType: 'bed_in_double', participant1Nick: 'nicknameForPair1', participant2Nick: 'nicknameForPair2'}, err => {
        const pairEvents = saveEventStore.firstCall.args[0].state.events;
        expect(pairEvents).to.have.length(3);
        expect(pairEvents[2].participant1Id).to.be('memberIdForPair1');
        expect(pairEvents[2].participant2Id).to.be('memberIdForPair2');

        const readModel = cache.get(socratesConstants.currentUrl + '_roomsReadModel');
        expect(readModel.roomPairsFor('bed_in_double')).to.have.length(1);

        done(err);
      });
    });

    it('does not add a participant pair if the first nickname is empty', done => {
      socratesActivitiesService.addParticipantPairFor({roomType: 'bed_in_double', participant1Nick: '', participant2Nick: 'nicknameForPair2'}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['An empty first nickname is invalid!']);
        done();
      });
    });

    it('does not add a participant pair if the second nickname is empty', done => {
      socratesActivitiesService.addParticipantPairFor({roomType: 'bed_in_double', participant1Nick: 'nicknameForPair1', participant2Nick: ''}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['An empty second nickname is invalid!']);
        done();
      });
    });

    it('does not add a participant pair if the room type is invalid', done => {
      socratesActivitiesService.addParticipantPairFor({roomType: 'unknown', participant1Nick: 'nicknameForPair1', participant2Nick: 'nicknameForPair2'}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('removeParticipantPairFor', () => {

    it('removes a room pair', done => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('bed_in_double', 2, 'memberIdForPair1', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('bed_in_double', 2, 'memberIdForPair2', aLongTimeAgo),
        events.roomPairWasAdded('bed_in_double', 'memberIdForPair1', 'memberIdForPair2')
      ];

      expect(new RoomsReadModel(listOfEvents, new RegistrationReadModel(listOfEvents)).roomPairsFor('bed_in_double')).to.eql([{ // TODO extract to its own test!
        participant1Id: 'memberIdForPair1',
        participant2Id: 'memberIdForPair2'
      }]);

      socratesActivitiesService.removeParticipantPairFor({roomType: 'bed_in_double', participant1Nick: 'nicknameForPair1', participant2Nick: 'nicknameForPair2'}, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'bed_in_double', memberId: 'memberIdForPair1', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'bed_in_double', memberId: 'memberIdForPair2', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.ROOM_PAIR_WAS_ADDED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'},
          {event: e.ROOM_PAIR_WAS_REMOVED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'}
        ]);

        const readModel = cache.get(socratesConstants.currentUrl + '_roomsReadModel');
        expect(readModel.roomPairsFor('bed_in_double')).to.have.length(0);

        //      expect(new RoomsReadModel(listOfEvents, new RegistrationWriteModel(listOfEvents, new SoCraTesReadModel(listOfEvents))).roomPairsFor('bed_in_double')).to.eql([]);
        done(err);
      });
    });

    it('does not remove a participant pair if the first nickname is empty', done => {
      socratesActivitiesService.removeParticipantPairFor({roomType: 'bed_in_double', participant1Nick: '', participant2Nick: 'nicknameForPair2'}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['An empty first nickname is invalid!']);
        done();
      });
    });

    it('does not remove a participant pair if the second nickname is empty', done => {
      socratesActivitiesService.removeParticipantPairFor({roomType: 'bed_in_double', participant1Nick: 'nicknameForPair1', participant2Nick: ''}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['An empty second nickname is invalid!']);
        done();
      });
    });

    it('does not remove a participant pair if the room type is invalid', done => {
      socratesActivitiesService.removeParticipantPairFor({roomType: 'unknown', participant1Nick: 'nicknameForPair1', participant2Nick: 'nicknameForPair2'}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('removeParticipant', () => {

    it('removes a participant from the given resource', done => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('bed_in_double', 2, 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.removeParticipantFor({roomType: 'bed_in_double', participantNick: 'nickname'}, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberId: 'memberId'}
        ]);

        expect(removedFromParticipantsNotification.called).to.be.true();

        //      expect(R.keys(new RegistrationWriteModel(listOfEvents, new SoCraTesReadModel(listOfEvents)).participantsByMemberIdFor('bed_in_double'))).to.eql([]);
        done(err);
      });
    });

    it('when removing a participant, also removes him from his room pair and updates event store and read/write models', done => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('bed_in_double', 2, 'memberIdForPair1', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('bed_in_double', 2, 'memberIdForPair2', aLongTimeAgo),
        events.roomPairWasAdded('bed_in_double', 'memberIdForPair1', 'memberIdForPair2')
      ];

      socratesActivitiesService.removeParticipantFor({roomType: 'bed_in_double', participantNick: 'nicknameForPair1'}, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'bed_in_double', memberId: 'memberIdForPair1', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'bed_in_double', memberId: 'memberIdForPair2', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.ROOM_PAIR_WAS_ADDED, roomType: 'bed_in_double', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'},
          {event: e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberIdToBeRemoved: 'memberIdForPair1', participant1Id: 'memberIdForPair1', participant2Id: 'memberIdForPair2'},
          {event: e.PARTICIPANT_WAS_REMOVED, roomType: 'bed_in_double', memberId: 'memberIdForPair1'}
        ]);

        expect(removedFromParticipantsNotification.called).to.be.true();

        const registrationWriteModel = cache.get(socratesConstants.currentUrl + '_registrationWriteModel');
        const roomsReadModel = cache.get(socratesConstants.currentUrl + '_roomsReadModel');
        expect(registrationWriteModel.participantEventFor('memberIdForPair2').roomType).to.eql('bed_in_double');
        expect(roomsReadModel.roomPairsFor('bed_in_double')).to.eql([]);
        done(err);
      });
    });

    it('does not send a notification when the removal fails because the participant was not registered', done => {
      listOfEvents = [];

      socratesActivitiesService.removeParticipantFor({roomType: 'bed_in_double', participantNick: 'nickname'}, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED, roomType: 'bed_in_double', memberId: 'memberId'}
        ]);

        expect(removedFromParticipantsNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not send a notification when the removal fails because the room type does not match', done => {
      listOfEvents = [
        events.registeredParticipantFromWaitinglist('bed_in_double', 2, 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.removeParticipantFor({roomType: 'single', participantNick: 'nickname'}, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST, roomType: 'bed_in_double', memberId: 'memberId', duration: 2, joinedSoCraTes: aLongTimeAgo.valueOf()},
          {event: e.DID_NOT_REMOVE_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED_FOR_THIS_ROOM_TYPE, roomType: 'single', memberId: 'memberId'}
        ]);

        expect(removedFromParticipantsNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not remove a participant if the nickname is empty', done => {
      socratesActivitiesService.removeParticipantFor({roomType: 'bed_in_double', participantNick: ''}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromParticipantsNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not remove a participant if the room type is invalid', done => {
      socratesActivitiesService.removeParticipantFor({roomType: 'unknown', participantNick: 'nickname'}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromParticipantsNotification.called).to.be.false();
        expect(err.errors).to.eql(['The room type is invalid!']);
        done();
      });
    });

  });

  describe('newWaitinglistFor', () => {

    it('changes the waitinglist of a waitinglist member and updates the event store and the write model', done => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered(['single'], 2, 'session-id', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: ['bed_in_double']}, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf(), sessionId: 'session-id'},
          {event: e.DESIRED_ROOM_TYPES_WERE_CHANGED, desiredRoomTypes: ['bed_in_double'], memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()}
        ]);

        expect(changedWaitinglistNotification.called).to.be.true();

        const writeModel = cache.get(socratesConstants.currentUrl + '_registrationWriteModel');
        expect(writeModel.roomTypesOf('memberId')).to.eql(['bed_in_double']);

        done(err);
      });
    });

    it('does not change the waitinglist of a non-waitinglist member and updates the event store and the read model', done => {
      listOfEvents = [];

      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: ['bed_in_double']}, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_PARTICIPANT_IS_NOT_ON_WAITINGLIST, desiredRoomTypes: ['bed_in_double'], memberId: 'memberId'}
        ]);

        expect(changedWaitinglistNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not change the waitinglist if the new options are identical to the old options', done => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered(['single'], 2, 'session-id', 'memberId', aLongTimeAgo)
      ];

      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: ['single']}, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf(), sessionId: 'session-id'},
          {event: e.DID_NOT_CHANGE_DESIRED_ROOM_TYPES_BECAUSE_THERE_WAS_NO_CHANGE, desiredRoomTypes: ['single'], memberId: 'memberId'}
        ]);

        expect(changedWaitinglistNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not change the waitinglist if the nickname is empty', done => {
      socratesActivitiesService.newWaitinglistFor({nickname: '', newDesiredRoomTypes: ['single']}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(changedWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not change the waitinglist if one of the room types is invalid', done => {
      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: ['single', 'unknown']}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(changedWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['One of the room types is invalid!']);
        done();
      });
    });

    it('does not change the waitinglist if the list of room types is empty', done => {
      socratesActivitiesService.newWaitinglistFor({nickname: 'nickname', newDesiredRoomTypes: []}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(changedWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['Please select at least one desired room type!']);
        done();
      });
    });

  });

  describe('removeWaitinglistParticipant', () => {

    it('removes a waitinglist member from the given resource and updates event store and write model', done => {
      listOfEvents = [
        events.waitinglistParticipantWasRegistered(['single'], 2, 'session-id', 'memberId', aLongTimeAgo)
      ];

      const params = {desiredRoomTypes: ['single'], waitinglistMemberNick: 'nickname'};
      socratesActivitiesService.removeWaitinglistMemberFor(params, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId', joinedWaitinglist: aLongTimeAgo.valueOf()},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REMOVED, desiredRoomTypes: ['single'], memberId: 'memberId'}
        ]);

        expect(removedFromWaitinglistNotification.called).to.be.true();

        const writeModel = cache.get(socratesConstants.currentUrl + '_registrationWriteModel');
        expect(writeModel.roomTypesOf('memberId')).to.eql([]);
        done(err);
      });
    });

    it('does not remove a waitinglist member if they are not registered', done => {
      listOfEvents = [];

      const params = {desiredRoomTypes: ['single'], waitinglistMemberNick: 'nickname'};
      socratesActivitiesService.removeWaitinglistMemberFor(params, err => {
        const savedEventStore = saveEventStore.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.DID_NOT_REMOVE_WAITINGLIST_PARTICIPANT_BECAUSE_THEY_ARE_NOT_REGISTERED, desiredRoomTypes: ['single'], memberId: 'memberId'}
        ]);

        expect(removedFromWaitinglistNotification.called).to.be.false();
        done(err);
      });
    });

    it('does not remove from the waitinglist if the nickname is empty', done => {
      socratesActivitiesService.removeWaitinglistMemberFor({waitinglistMemberNick: '', desiredRoomTypes: ['single']}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['An empty nickname is invalid!']);
        done();
      });
    });

    it('does not remove from the waitinglist if one of the room types is invalid', done => {
      socratesActivitiesService.removeWaitinglistMemberFor({waitinglistMemberNick: 'nickname', desiredRoomTypes: ['single', 'unknown']}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['One of the room types is invalid!']);
        done();
      });
    });

    it('does not remove from the waitinglist if the list of room types is empty', done => {
      socratesActivitiesService.removeWaitinglistMemberFor({waitinglistMemberNick: 'nickname', desiredRoomTypes: []}, err => {
        expect(saveEventStore.called).to.be.false();
        expect(removedFromWaitinglistNotification.called).to.be.false();
        expect(err.errors).to.eql(['Please select at least one desired room type!']);
        done();
      });
    });

  });
});
