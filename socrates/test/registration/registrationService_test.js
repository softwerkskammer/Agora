/* eslint no-underscore-dangle: 0 */
'use strict';

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');
const moment = require('moment-timezone');
const R = require('ramda');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const cache = conf.get('cache');

const registrationService = beans.get('registrationService');

const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');

const Member = beans.get('member');
const Subscriber = beans.get('subscriber');

const notifications = beans.get('socratesNotifications');

const events = beans.get('events');
const GlobalEventStore = beans.get('GlobalEventStore');
const RegistrationCommandProcessor = beans.get('RegistrationCommandProcessor');
const eventstore = beans.get('eventstore');
const e = beans.get('eventConstants');

function stripTimestamps(someEvents) {
  return someEvents.map(event => {
    const newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  });
}

const now = moment.tz();
const aShortTimeAgo = moment.tz().subtract(10, 'minutes');
const aLongTimeAgo = moment.tz().subtract(40, 'minutes');

describe('Registration Service', () => {

  let registrationBody;

  let eventStore;
  let saveSubscriberCount;
  let saveEventStoreStub;
  const desiredRoomsArray = ['single', 'junior'];

  beforeEach(() => {
    cache.flushAll();

    registrationBody = {
      activityUrl: 'socrates-url',
      desiredRoomTypes: desiredRoomsArray.toString(),
      sessionId: 'sessionId'
    };

    eventStore = new GlobalEventStore({
      url: 'socrates-url',
      events: []
    });
    eventStore.state.events = [
      events.roomQuotaWasSet('single', 10)
    ];

    sinon.stub(notifications, 'newParticipant');
    sinon.stub(notifications, 'newWaitinglistEntry');

    sinon.stub(memberstore, 'getMember').callsFake((nickname, callback) => {
      callback(null, new Member({id: 'memberId'}));
    });
    sinon.stub(subscriberstore, 'getSubscriber').callsFake((memberId, callback) => {
      callback(null, new Subscriber({id: 'memberId'}));
    });
    sinon.stub(eventstore, 'getEventStore').callsFake((url, callback) => {
      if (url === 'wrongUrl') {
        return callback(new Error('Wrong URL!'));
      }
      if (url === 'socrates-url') {
        return callback(null, eventStore);
      }
      return callback(null);
    });

    saveEventStoreStub = sinon.stub(eventstore, 'saveEventStore').callsFake((activity, callback) => {callback();});
    saveSubscriberCount = 0;
    sinon.stub(subscriberstore, 'saveSubscriber').callsFake((activity, callback) => {
      saveSubscriberCount += 1;
      callback();
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  // TODO check that other entries remain intact!

  describe('starting the registration', () => {

    let registrationTuple;

    beforeEach(() => {
      registrationTuple = {
        activityUrl: 'socrates-url',
        duration: 2,
        desiredRoomTypes: ['single'],
        sessionId: 'sessionId'
      };
    });

    it('returns an error if fetching the activity produces an error', done => {
      registrationTuple.activityUrl = 'wrongUrl';
      registrationService.startRegistration(registrationTuple, 'memberId', now, err => {
        expect(err.message).to.be('Wrong URL!');
        done();
      });
    });

    it('returns a status message title and text if the activity cannot be found', done => {
      registrationTuple.activityUrl = 'unknown-url';
      registrationService.startRegistration(registrationTuple, 'memberId', now, (err, statusTitle, statusText) => {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('message.content.activities.does_not_exist');
        done(err);
      });
    });

    it('adds the registrant to the waitinglist, stores the event and updates the write model', done => {
      registrationService.startRegistration(registrationTuple, 'memberId', now, (err, statusTitle, statusText) => {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        const writeModel = cache.get('socrates-url_registrationWriteModel');

        const reservationEvent = {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', duration: 2, joinedWaitinglist: now.valueOf()};

        expect(stripTimestamps([writeModel.waitinglistReservation('sessionId')])).to.eql([reservationEvent]);

        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 10},
          reservationEvent
        ]);
        done(err);
      });
    });

    it('returns no error if waitinglist reservation fails due to duplicate reservation - let the user continue', done => {
      registrationTuple.duration = 3;
      registrationTuple.desiredRoomTypes = ['single'];
      sinon.stub(RegistrationCommandProcessor.prototype, 'issueWaitinglistReservation').callsFake(() => {return {event: e.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION}; });

      registrationService.startRegistration(registrationTuple, 'memberId', now, (err, statusTitle, statusText) => {
        expect(statusTitle).not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

  });

  describe('finishing the registration - general errors', () => {

    it('returns an error if fetching the activity produces an error', done => {
      registrationBody.activityUrl = 'wrongUrl';
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, err => {
        expect(err.message).to.be('Wrong URL!');
        done();
      });
    });

    it('returns nothing if the activity cannot be found', done => {
      registrationBody.activityUrl = 'unknown-url';
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

    it('returns error and saves subscriber info if waitinglist registration fails due to expired session', done => {
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant').callsFake(() => {return {event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION};});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.registration_timed_out');
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

    it('returns error and saves subscriber info if waitinglist registration fails due to duplicate booking', done => {
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant').callsFake(() => {return {event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME};});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.already_registered');
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

    it('returns nothing and saves subscriber info if waitinglist registration succeeds', done => {
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant').callsFake(() => {return events.waitinglistParticipantWasRegistered(['single'], 2, 'sessionId', 'memberId', aShortTimeAgo);});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

  });

  describe('finishing the registration - normal registration', () => {

    it('adds the registrant to the resource if he has a waitinglist reservation and has a valid session entry', done => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(registrationBody.desiredRoomTypes, 2, registrationBody.sessionId, 'memberId', aShortTimeAgo),
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {
            event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
            desiredRoomTypes: 'single,junior',
            duration: 2,
            sessionId: 'sessionId',
            memberId: 'memberId',
            joinedWaitinglist: aShortTimeAgo.valueOf()
          },
          {
            event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
            desiredRoomTypes: ['single', 'junior'],
            duration: 2,
            sessionId: 'sessionId',
            memberId: 'memberId',
            joinedWaitinglist: aShortTimeAgo.valueOf()
          }
        ]);
        done(err);
      });
    });

    it('does not add the registrant to the resource if no sessionId entry exists, even if there is enough space', done => {
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {

        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 10},
          {
            event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION,
            memberId: 'memberId',
            sessionId: 'sessionId',
            desiredRoomTypes: ['single', 'junior']
          }
        ]);
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.registration_timed_out');
        done(err);
      });
    });

    it('does not add the registrant to a room if he is on the waitinglist', done => {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered(desiredRoomsArray, 2, registrationBody.sessionId, 'memberId', aShortTimeAgo)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {
            event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
            desiredRoomTypes: ['single', 'junior'],
            duration: 2,
            sessionId: 'sessionId',
            memberId: 'memberId',
            joinedWaitinglist: aShortTimeAgo.valueOf()
          },
          {
            event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME,
            desiredRoomTypes: ['single', 'junior'],
            memberId: 'memberId',
            sessionId: 'sessionId'
          }
        ]);

        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.already_registered');
        done(err);
      });
    });

  });

  describe('finishing the registration - waitinglist registration', () => {

    it('adds the registrant to the waitinglist if he had a valid session entry', done => {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(registrationBody.desiredRoomTypes.split(','), 2, registrationBody.sessionId, 'memberId', aShortTimeAgo)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {
            event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
            sessionId: 'sessionId',
            desiredRoomTypes: ['single', 'junior'],
            duration: 2,
            memberId: 'memberId',
            joinedWaitinglist: aShortTimeAgo.valueOf()
          },
          {
            event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED,
            sessionId: 'sessionId',
            memberId: 'memberId',
            desiredRoomTypes: ['single', 'junior'],
            duration: 2,
            joinedWaitinglist: aShortTimeAgo.valueOf()
          }]);

        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if there is no reservation for the session id', done => {
      registrationBody.roomType = '';
      registrationBody.duration = '';
      registrationBody.desiredRoomTypes = 'single';

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {

        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 10},
          {
            event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION,
            sessionId: 'sessionId',
            memberId: 'memberId',
            desiredRoomTypes: ['single']
          }
        ]);
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.registration_timed_out');
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if the reservation is already expired', done => {
      registrationBody.desiredRoomTypes = 'single';

      eventStore.state.events = [
        events.waitinglistReservationWasIssued([registrationBody.desiredRoomTypes], 2, registrationBody.sessionId, 'memberId', aLongTimeAgo)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {
            event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
            sessionId: 'sessionId',
            desiredRoomTypes: ['single'],
            duration: 2,
            memberId: 'memberId',
            joinedWaitinglist: aLongTimeAgo.valueOf()
          },
          {
            event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION,
            sessionId: 'sessionId',
            memberId: 'memberId',
            desiredRoomTypes: ['single']
          }
        ]);
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.registration_timed_out');
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if he is already registered', done => {
      registrationBody.roomType = '';
      registrationBody.duration = '';
      registrationBody.desiredRoomTypes = 'single';

      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist('single', 2, 'memberId', aShortTimeAgo),
        events.waitinglistReservationWasIssued([registrationBody.desiredRoomTypes], 2, registrationBody.sessionId, 'memberId', aShortTimeAgo)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, (err, statusTitle, statusText) => {
        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {
            event: e.REGISTERED_PARTICIPANT_FROM_WAITINGLIST,
            roomType: 'single',
            duration: 2,
            memberId: 'memberId',
            joinedSoCraTes: aShortTimeAgo.valueOf()
          },
          {
            event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
            sessionId: 'sessionId',
            desiredRoomTypes: ['single'],
            duration: 2,
            memberId: 'memberId',
            joinedWaitinglist: aShortTimeAgo.valueOf()
          },
          {
            event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME,
            sessionId: 'sessionId',
            memberId: 'memberId',
            desiredRoomTypes: ['single']
          }
        ]);

        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.already_registered');
        done(err);
      });
    });
  });

});
