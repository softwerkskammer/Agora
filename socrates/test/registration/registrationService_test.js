/* eslint no-underscore-dangle: 0 */
'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var moment = require('moment-timezone');
var R = require('ramda');

const conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
const cache = conf.get('cache');

var registrationService = beans.get('registrationService');

var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');

var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var notifications = beans.get('socratesNotifications');

var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationCommandProcessor = beans.get('RegistrationCommandProcessor');
var eventstore = beans.get('eventstore');
var e = beans.get('eventConstants');

function stripTimestamps(someEvents) {
  return someEvents.map(function (event) {
    var newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  });
}

var now = moment.tz();
var aShortTimeAgo = moment.tz().subtract(10, 'minutes');
var aLongTimeAgo = moment.tz().subtract(40, 'minutes');

describe('Registration Service', function () {

  var registrationBody;

  var eventStore;
  var saveSubscriberCount;
  var saveEventStoreStub;
  var desiredRoomsArray = ['single', 'junior'];

  beforeEach(function () {
    cache.flushAll();

    registrationBody = {
      activityUrl: 'socrates-url',
      duration: 2,
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

    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      callback(null, new Member({id: 'memberId'}));
    });
    sinon.stub(subscriberstore, 'getSubscriber', function (memberId, callback) {
      callback(null, new Subscriber({id: 'memberId'}));
    });
    sinon.stub(eventstore, 'getEventStore', function (url, callback) {
      if (url === 'wrongUrl') {
        return callback(new Error('Wrong URL!'));
      }
      if (url === 'socrates-url') {
        return callback(null, eventStore);
      }
      return callback(null);
    });

    saveEventStoreStub = sinon.stub(eventstore, 'saveEventStore', function (activity, callback) {callback();});
    saveSubscriberCount = 0;
    sinon.stub(subscriberstore, 'saveSubscriber', function (activity, callback) {
      saveSubscriberCount += 1;
      callback();
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  // TODO check that other entries remain intact!

  describe('starting the registration', function () {

    var registrationTuple;

    beforeEach(function () {
      registrationTuple = {
        activityUrl: 'socrates-url',
        duration: 2,
        desiredRoomTypes: ['single'],
        sessionId: 'sessionId'
      };
    });

    it('returns an error if fetching the activity produces an error', function (done) {
      registrationTuple.activityUrl = 'wrongUrl';
      registrationService.startRegistration(registrationTuple, 'memberId', now, function (err) {
        expect(err.message).to.be('Wrong URL!');
        done();
      });
    });

    it('returns a status message title and text if the activity cannot be found', function (done) {
      registrationTuple.activityUrl = 'unknown-url';
      registrationService.startRegistration(registrationTuple, 'memberId', now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('message.content.activities.does_not_exist');
        done(err);
      });
    });

    it('adds the registrant to the waitinglist, stores the event and updates the read model', function (done) {
      registrationService.startRegistration(registrationTuple, 'memberId', now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        const readModel = cache.get('socrates-url_registrationReadModel');

        expect(readModel.waitinglistReservationsAndParticipantsFor('single')).to.have.length(1);
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].event).to.eql('WAITINGLIST-RESERVATION-WAS-ISSUED');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].sessionId).to.eql('sessionId');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].memberId).to.eql('memberId');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].desiredRoomTypes).to.eql(['single']);
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].joinedWaitinglist).to.eql(now.valueOf());

        const savedEventStore = saveEventStoreStub.firstCall.args[0];
        expect(stripTimestamps(savedEventStore.state.events)).to.eql([
          {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 10},
          {
            event: e.WAITINGLIST_RESERVATION_WAS_ISSUED,
            sessionId: 'sessionId',
            desiredRoomTypes: ['single'],
            memberId: 'memberId',
            duration: 2,
            joinedWaitinglist: now.valueOf()
          }
        ]);
        done(err);
      });
    });

    it('returns no error if waitinglist reservation fails due to duplicate reservation - let the user continue', function (done) {
      registrationTuple.duration = 3;
      registrationTuple.desiredRoomTypes = ['single'];
      sinon.stub(RegistrationCommandProcessor.prototype, 'issueWaitinglistReservation', function () {return {event: e.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION}; });

      registrationService.startRegistration(registrationTuple, 'memberId', now, function (err, statusTitle, statusText) {
        expect(statusTitle).not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

  });

  describe('finishing the registration - general errors', function () {

    it('returns an error if fetching the activity produces an error', function (done) {
      registrationBody.activityUrl = 'wrongUrl';
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err) {
        expect(err.message).to.be('Wrong URL!');
        done();
      });
    });

    it('returns nothing if the activity cannot be found', function (done) {
      registrationBody.activityUrl = 'unknown-url';
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

    it('returns error and saves subscriber info if waitinglist registration fails due to expired session', function (done) {
      registrationBody.duration = 3;
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant', function () {return {event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION};});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.registration_timed_out');
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

    it('returns error and saves subscriber info if waitinglist registration fails due to duplicate booking', function (done) {
      registrationBody.duration = 3;
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant', function () {return {event: e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME};});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.already_registered');
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

    it('returns nothing and saves subscriber info if waitinglist registration succeeds', function (done) {
      registrationBody.duration = 3;
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant', function () {return events.waitinglistParticipantWasRegistered(['single'], 2, 'sessionId', 'memberId', aShortTimeAgo);});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

  });

  describe('finishing the registration - normal registration', function () {

    it('adds the registrant to the resource if he has a waitinglist reservation and has a valid session entry', function (done) {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(registrationBody.desiredRoomTypes, 2, registrationBody.sessionId, 'memberId', aShortTimeAgo),
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
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

    it('does not add the registrant to the resource if no sessionId entry exists, even if there is enough space', function (done) {
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {

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

    it('does not add the registrant to a room if he is on the waitinglist', function (done) {
      eventStore.state.events = [
        events.waitinglistParticipantWasRegistered(desiredRoomsArray, 2, registrationBody.sessionId, 'memberId', aShortTimeAgo)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
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

  describe('finishing the registration - waitinglist registration', function () {

    it('adds the registrant to the waitinglist if he had a valid session entry', function (done) {
      eventStore.state.events = [
        events.waitinglistReservationWasIssued(registrationBody.desiredRoomTypes.split(','), 2, registrationBody.sessionId, 'memberId', aShortTimeAgo)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
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

    it('does not add the registrant to the waitinglist if there is no reservation for the session id', function (done) {
      registrationBody.roomType = '';
      registrationBody.duration = '';
      registrationBody.desiredRoomTypes = 'single';

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {

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

    it('does not add the registrant to the waitinglist if the reservation is already expired', function (done) {
      registrationBody.desiredRoomTypes = 'single';

      eventStore.state.events = [
        events.waitinglistReservationWasIssued([registrationBody.desiredRoomTypes], 2, registrationBody.sessionId, 'memberId', aLongTimeAgo)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
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

    it('does not add the registrant to the waitinglist if he is already registered', function (done) {
      registrationBody.roomType = '';
      registrationBody.duration = '';
      registrationBody.desiredRoomTypes = 'single';

      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist('single', 2, 'memberId', aShortTimeAgo),
        events.waitinglistReservationWasIssued([registrationBody.desiredRoomTypes], 2, registrationBody.sessionId, 'memberId', aShortTimeAgo)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, function (err, statusTitle, statusText) {
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
