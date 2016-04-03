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
var eventstore = beans.get('eventstore');
var e = beans.get('eventConstants');

function setTimestamp(event, timestamp) {
  event.timestamp = timestamp;
  return event;
}

function stripTimestamps(someEvents) {
  return someEvents.map(function (event) {
    var newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  });
}

describe('Registration Service', function () {

  var registrationTuple;

  var eventStore;
  var readModel;

  beforeEach(function () {
    registrationTuple = {
      activityUrl: 'socrates-url',
      resourceName: 'single',
      duration: 2,
      sessionID: 'sessionId'
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
    sinon.stub(subscriberstore, 'saveSubscriber', function (subscriber, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  // TODO check that other entries remain intact!

  describe('starting the registration', function () {

    it('returns an error if fetching the activity produces an error', function (done) {
      registrationTuple.activityUrl = 'wrongUrl';
      registrationService.startRegistration(registrationTuple, function (err) {
        expect(err.message).to.be('Wrong URL!');
        done();
      });
    });

    it('returns a status message title and text if the activity cannot be found', function (done) {
      registrationTuple.activityUrl = 'unknown-url';
      registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('message.content.activities.does_not_exist');
        done(err);
      });
    });

    it('adds the registrant to the resource if the registration data says so', function (done) {

      registrationService.startRegistration(registrationTuple, function (err) {
        expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(1);
        expect(readModel.reservationsAndParticipantsFor('single')[0].event).to.eql('RESERVATION-WAS-ISSUED');
        expect(readModel.reservationsAndParticipantsFor('single')[0].sessionID).to.eql('sessionId');
        expect(readModel.reservationsAndParticipantsFor('single')[0].roomType).to.eql('single');
        expect(readModel.reservationsAndParticipantsFor('single')[0].duration).to.eql(2);
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')).to.have.length(0);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if the registration data says so', function (done) {
      registrationTuple.duration = 'waitinglist';
      registrationTuple.resourceName = undefined;
      registrationTuple.desiredRoomTypes = ['single'];

      registrationService.startRegistration(registrationTuple, function (err) {
        expect(readModel.reservationsAndParticipantsFor('single')).to.have.length(0);
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')).to.have.length(1);
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].event).to.eql('WAITINGLIST-RESERVATION-WAS-ISSUED');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].sessionID).to.eql('sessionId');
        expect(readModel.waitinglistReservationsAndParticipantsFor('single')[0].desiredRoomTypes).to.eql(['single']);
        done(err);
      });
    });

  });

  describe('finishing the registration - general errors', function () {

    it('returns an error if fetching the activity produces an error', function (done) {
      registrationTuple.activityUrl = 'wrongUrl';
      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err) {
        expect(err.message).to.be('Wrong URL!');
        done();
      });
    });

    it('returns nothing if the activity cannot be found', function (done) {
      registrationTuple.activityUrl = 'unknown-url';
      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

  });

  describe('finishing the registration - normal registration', function () {

    it('adds the registrant to the resource if he had a valid session entry', function (done) {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.RESERVATION_WAS_ISSUED, roomType: 'single', duration: 2, sessionID: 'sessionId'},
          {event: e.PARTICIPANT_WAS_REGISTERED, roomType: 'single', duration: 2, sessionID: 'sessionId', memberId: 'memberId'}
        ]);
        done(err);
      });
    });

    it('adds the registrant to the resource if he has a waitinglist reservation and has a valid session entry, removing him from the waitinglist', function (done) {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(registrationTuple.resourceName, registrationTuple.sessionID),
        events.reservationWasIssued(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, desiredRoomTypes: 'single', sessionID: 'sessionId'},
          {event: e.RESERVATION_WAS_ISSUED, roomType: 'single', duration: 2, sessionID: 'sessionId'},
          {event: e.PARTICIPANT_WAS_REGISTERED, roomType: 'single', duration: 2, sessionID: 'sessionId', memberId: 'memberId'}
        ]);
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(readModel.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(readModel.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('adds the registrant to the resource if he is on the waitinglist and has a valid session entry, removing him from the waitinglist', function (done) {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered(registrationTuple.resourceName, registrationTuple.sessionID, 'memberId'),
        events.reservationWasIssued(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(readModel.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(readModel.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('adds the registrant to the resource even if no sessionId entry exists, provided there is enough space', function (done) {
      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be(undefined);
        expect(statusText).to.be(undefined);
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(readModel.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(readModel.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('adds the registrant to the resource if the sessionId entry is already expired, if there is enough space', function (done) {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID), moment().subtract(1, 'hours'))];

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be(undefined);
        expect(statusText).to.be(undefined);
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(readModel.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(readModel.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('does not add the registrant to the resource if he is already registered', function (done) {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID, 'memberId')];

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.already_registered');
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(readModel.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(readModel.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });
  });

  describe('finishing the registration - waitinglist registration', function () {

    it('adds the registrant to the waitinglist if he had a valid session entry', function (done) {
      registrationTuple.duration = 'waitinglist';
      registrationTuple.resourceName = undefined;
      // here, registrationTuple is actually the body
      registrationTuple.desiredRoomTypes = 'single';

      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued([registrationTuple.desiredRoomTypes], registrationTuple.sessionID)];

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(stripTimestamps(eventStore.state.registrationEvents)).to.eql([
          {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: 'sessionId', desiredRoomTypes: ['single']},
          {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: 'sessionId', memberId: 'memberId', desiredRoomTypes: ['single']}]);

        // TODO pull out into read model test:
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(readModel.participantsByMemberIdFor('single')).to.eql({});
        expect(readModel.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor('single'))).to.eql(['memberId']);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if there is no reservation for the session id but there is enough space in the resource', function (done) {
      registrationTuple.duration = 'waitinglist';
      // here, registrationTuple is actually the body
      registrationTuple.desiredRoomTypes = 'single';

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be(undefined);
        expect(statusText).to.be(undefined);
        expect(readModel.reservationsBySessionIdFor('single')).to.eql({});
        expect(readModel.participantsByMemberIdFor('single')).to.eql({});
        expect(readModel.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(readModel.waitinglistParticipantsByMemberIdFor('single'))).to.eql(['memberId']);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if the reservation is already expired but there is enough space in the resource', function (done) {
      registrationTuple.duration = 'waitinglist';
      registrationTuple.resourceName = undefined;
      // here, registrationTuple is actually the body
      registrationTuple.desiredRoomTypes = 'single';

      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(registrationTuple.desiredRoomTypes, registrationTuple.sessionID), moment().subtract(1, 'hours'))];

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
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
      registrationTuple.duration = 'waitinglist';

      eventStore.state.registrationEvents = [
        events.participantWasRegistered(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID, 'memberId'),
        events.waitinglistReservationWasIssued(registrationTuple.resourceName, registrationTuple.sessionID)
      ];

      registrationService.completeRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
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
