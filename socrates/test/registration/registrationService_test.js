/* eslint no-underscore-dangle: 0 */
'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var moment = require('moment-timezone');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');

var registrationService = beans.get('registrationService');

var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');

var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var notifications = beans.get('socratesNotifications');

var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');
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
  var readModel;
  var saveSubscriberCount;

  beforeEach(function () {
    registrationBody = {
      activityUrl: 'socrates-url',
      roomType: 'single',
      duration: 2,
      desiredRoomTypes: '',
      sessionId: 'sessionId'
    };

    eventStore = new GlobalEventStore();
    eventStore.state.socratesEvents = [
      events.roomQuotaWasSet('single', 10)
    ];
    readModel = new RegistrationReadModel(eventStore);

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

    sinon.stub(eventstore, 'saveEventStore', function (activity, callback) { callback(); });
    saveSubscriberCount = 0;
    sinon.stub(subscriberstore, 'saveSubscriber', function (activity, callback) { saveSubscriberCount += 1; callback(); });
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
        roomType: 'single',
        duration: 2,
        desiredRoomTypes: [],
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

    it('adds the registrant to the resource if the registration data says so', function (done) {

      registrationService.startRegistration(registrationTuple, 'memberId', now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();

        expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(1);
        expect(readModel.reservationsAndParticipantsFor('single')[0].event).to.eql('RESERVATION-WAS-ISSUED');
        expect(readModel.reservationsAndParticipantsFor('single')[0].sessionId).to.eql('sessionId');
        expect(readModel.reservationsAndParticipantsFor('single')[0].memberId).to.eql('memberId');
        expect(readModel.reservationsAndParticipantsFor('single')[0].roomType).to.eql('single');
        expect(readModel.reservationsAndParticipantsFor('single')[0].duration).to.eql(2);
        expect(readModel.reservationsAndParticipantsFor('single')[0].joinedSoCraTes).to.eql(now.valueOf());
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')).to.have.length(0);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if the registration data says so', function (done) {
      registrationTuple.duration = undefined;
      registrationTuple.roomType = undefined;
      registrationTuple.desiredRoomTypes = ['single'];

      registrationService.startRegistration(registrationTuple, 'memberId', now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();

        expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(0);
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')).to.have.length(1);
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].event).to.eql('WAITINGLIST-RESERVATION-WAS-ISSUED');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].sessionId).to.eql('sessionId');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].memberId).to.eql('memberId');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].desiredRoomTypes).to.eql(['single']);
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].joinedWaitinglist).to.eql(now.valueOf());
        done(err);
      });
    });

    it('returns no error if reservation fails due to duplicate reservation - let the user continue', function (done) {
      registrationTuple.duration = 3;
      registrationTuple.roomType = 'junior';
      registrationTuple.desiredRoomTypes = ['single'];
      sinon.stub(RegistrationCommandProcessor.prototype, 'issueReservation', function () {return e.DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION;});
      sinon.stub(RegistrationCommandProcessor.prototype, 'issueWaitinglistReservation', function () {return undefined;});

      registrationService.startRegistration(registrationTuple, 'memberId', now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

    it('returns error if reservation fails due to full ressource', function (done) {
      registrationTuple.duration = 3;
      registrationTuple.roomType = 'junior';
      registrationTuple.desiredRoomTypes = ['single'];
      sinon.stub(RegistrationCommandProcessor.prototype, 'issueReservation', function () {return e.DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE;});
      sinon.stub(RegistrationCommandProcessor.prototype, 'issueWaitinglistReservation', function () {return undefined;});

      registrationService.startRegistration(registrationTuple, 'memberId', now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.registration_is_full');
        done(err);
      });
    });

    it('returns no error if waitinglist reservation fails due to duplicate reservation - let the user continue', function (done) {
      registrationTuple.duration = 3;
      registrationTuple.roomType = 'junior';
      registrationTuple.desiredRoomTypes = ['single'];
      sinon.stub(RegistrationCommandProcessor.prototype, 'issueReservation', function () {return undefined;});
      sinon.stub(RegistrationCommandProcessor.prototype, 'issueWaitinglistReservation', function () {return e.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION;});

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
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err) {
        expect(err.message).to.be('Wrong URL!');
        done();
      });
    });

    it('returns nothing if the activity cannot be found', function (done) {
      registrationBody.activityUrl = 'unknown-url';
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

    it('returns error and saves subscriber info if registration fails due to full ressource', function (done) {
      registrationBody.duration = 3;
      registrationBody.roomType = 'junior';
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerParticipant', function () {return e.DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE;});
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant', function () {return undefined;});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.registration_timed_out');
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

    it('returns error and saves subscriber info if registration fails due to duplicate booking', function (done) {
      registrationBody.duration = 3;
      registrationBody.roomType = 'junior';
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerParticipant', function () {return e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME;});
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant', function () {return undefined;});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.already_registered');
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

    it('returns error and saves subscriber info if waitinglist registration fails due to duplicate booking', function (done) {
      registrationBody.duration = 3;
      registrationBody.roomType = 'junior';
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerParticipant', function () {return undefined;});
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant', function () {return e.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME;});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.already_registered');
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

    it('returns nothing and saves subscriber info if registration succeeds', function (done) {
      registrationBody.duration = 3;
      registrationBody.roomType = 'junior';
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerParticipant', function () {return e.PARTICIPANT_WAS_REGISTERED;});
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant', function () {return undefined;});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

    it('returns nothing and saves subscriber info if waitinglist registration succeeds', function (done) {
      registrationBody.duration = 3;
      registrationBody.roomType = 'junior';
      registrationBody.desiredRoomTypes = 'single';
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerParticipant', function () {return undefined;});
      sinon.stub(RegistrationCommandProcessor.prototype, 'registerWaitinglistParticipant', function () {return e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED;});

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(saveSubscriberCount).to.be(1);
        done(err);
      });
    });

  });

  describe('finishing the registration - normal registration', function () {

    it('adds the registrant to the resource if he had a valid session entry', function (done) {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(registrationBody.roomType, registrationBody.duration, registrationBody.sessionId, 'memberId', aShortTimeAgo)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.RESERVATION_WAS_ISSUED, roomType: 'single', duration: 2, sessionId: 'sessionId', memberId: 'memberId', joinedSoCraTes: aShortTimeAgo.valueOf()},
          {event: e.PARTICIPANT_WAS_REGISTERED, roomType: 'single', duration: 2, sessionId: 'sessionId', memberId: 'memberId', joinedSoCraTes: aShortTimeAgo.valueOf()}
        ]);
        done(err);
      });
    });

    it('adds the registrant to the resource if he has a waitinglist reservation and has a valid session entry, removing him from the waitinglist', function (done) {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(registrationBody.roomType, registrationBody.sessionId, 'memberId', aShortTimeAgo),
        events.reservationWasIssued(registrationBody.roomType, registrationBody.duration, registrationBody.sessionId, 'memberId', aShortTimeAgo)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, desiredRoomTypes: 'single', sessionId: 'sessionId', memberId: 'memberId', joinedWaitinglist: aShortTimeAgo.valueOf()},
          {event: e.RESERVATION_WAS_ISSUED, roomType: 'single', duration: 2, sessionId: 'sessionId', memberId: 'memberId', joinedSoCraTes: aShortTimeAgo.valueOf()},
          {event: e.PARTICIPANT_WAS_REGISTERED, roomType: 'single', duration: 2, sessionId: 'sessionId', memberId: 'memberId', joinedSoCraTes: aShortTimeAgo.valueOf()}
        ]);
        done(err);
      });
    });

    it('adds the registrant to the resource if he is on the waitinglist and has a valid session entry, removing him from the waitinglist', function (done) {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered(registrationBody.roomType, registrationBody.sessionId, 'memberId', aShortTimeAgo),
        events.reservationWasIssued(registrationBody.roomType, registrationBody.duration, registrationBody.sessionId, 'memberId', aShortTimeAgo)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();

        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, desiredRoomTypes: 'single', sessionId: 'sessionId', memberId: 'memberId', joinedWaitinglist: aShortTimeAgo.valueOf()},
          {event: e.RESERVATION_WAS_ISSUED, roomType: 'single', duration: 2, sessionId: 'sessionId', memberId: 'memberId', joinedSoCraTes: aShortTimeAgo.valueOf()},
          {event: e.PARTICIPANT_WAS_REGISTERED, roomType: 'single', memberId: 'memberId', sessionId: 'sessionId', duration: 2, joinedSoCraTes: aShortTimeAgo.valueOf()}
        ]);
        done(err);
      });
    });

    it('adds the registrant to the resource even if no sessionId entry exists, provided there is enough space', function (done) {
      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {

        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, memberId: 'memberId', sessionId: 'sessionId', roomType: 'single', duration: 2, joinedSoCraTes: now.valueOf()}
        ]);
        expect(statusTitle).to.be(undefined);
        expect(statusText).to.be(undefined);
        done(err);
      });
    });

    it('adds the registrant to the resource if the sessionId entry is already expired, if there is enough space', function (done) {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(registrationBody.roomType, registrationBody.duration, registrationBody.sessionId, 'memberId', aLongTimeAgo)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {

        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {duration: 2, event: e.RESERVATION_WAS_ISSUED, roomType: 'single', sessionId: 'sessionId', memberId: 'memberId', joinedSoCraTes: aLongTimeAgo.valueOf()},
          {duration: 2, event: e.PARTICIPANT_WAS_REGISTERED, memberId: 'memberId', roomType: 'single', sessionId: 'sessionId', joinedSoCraTes: now.valueOf()}
        ]);
        expect(statusTitle).to.be(undefined);
        expect(statusText).to.be(undefined);
        done(err);
      });
    });

    it('does not add the registrant to the resource if he is already registered', function (done) {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(registrationBody.roomType, registrationBody.duration, registrationBody.sessionId, 'memberId', aShortTimeAgo)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {

        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.PARTICIPANT_WAS_REGISTERED, roomType: 'single', memberId: 'memberId', sessionId: 'sessionId', duration: 2, joinedSoCraTes: aShortTimeAgo.valueOf()},
          {event: e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME, roomType: 'single', memberId: 'memberId', sessionId: 'sessionId', duration: 2}
        ]);
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.already_registered');
        done(err);
      });
    });
  });

  describe('finishing the registration - waitinglist registration', function () {

    it('adds the registrant to the waitinglist if he had a valid session entry', function (done) {
      registrationBody.roomType = '';
      registrationBody.duration = '';
      registrationBody.desiredRoomTypes = 'single';

      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued([registrationBody.desiredRoomTypes], registrationBody.sessionId, 'memberId', aShortTimeAgo)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionId: 'sessionId', desiredRoomTypes: ['single'], memberId: 'memberId', joinedWaitinglist: aShortTimeAgo.valueOf()},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', memberId: 'memberId', desiredRoomTypes: ['single'], joinedWaitinglist: aShortTimeAgo.valueOf()}]);

        done(err);
      });
    });

    it('adds the registrant to the waitinglist if there is no reservation for the session id but there is enough space in the resource', function (done) {
      registrationBody.roomType = '';
      registrationBody.duration = '';
      registrationBody.desiredRoomTypes = 'single';

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {

        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'sessionId', memberId: 'memberId', desiredRoomTypes: ['single'], joinedWaitinglist: now.valueOf()}
        ]);
        expect(statusTitle).to.be(undefined);
        expect(statusText).to.be(undefined);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if the reservation is already expired but there is enough space in the resource', function (done) {
      registrationBody.roomType = '';
      registrationBody.duration = '';
      registrationBody.desiredRoomTypes = 'single';

      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(registrationBody.desiredRoomTypes, registrationBody.sessionId, 'memberId', aLongTimeAgo)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be(undefined);
        expect(statusText).to.be(undefined);
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(readModel.participantsByMemberIdFor('single')).to.eql({});
        expect(readModel.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor('single'))).to.eql(['memberId']);
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if he is already registered - but does not delete the waitinglist reservation either', function (done) {
      registrationBody.roomType = '';
      registrationBody.duration = '';
      registrationBody.desiredRoomTypes = 'single';

      eventStore.state.registrationEvents = [
        events.participantWasRegistered('single', 2, registrationBody.sessionId, 'memberId', aShortTimeAgo),
        events.waitinglistReservationWasIssued([registrationBody.desiredRoomTypes], registrationBody.sessionId, 'memberId', aShortTimeAgo)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationBody, now, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('activities.registration_problem');
        expect(statusText).to.be('activities.already_registered');
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(R.keys(readModel.waitinglistReservationsBySessionIdFor('single'))).to.eql(['sessionId']);
        expect(readModel.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

  });

});
