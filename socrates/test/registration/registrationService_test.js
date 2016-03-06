/* eslint no-underscore-dangle: 0 */
'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var moment = require('moment-timezone');
var R = require('ramda');

var beans = require('../../testutil/configureForTest').get('beans');

var registrationService = beans.get('registrationService');

var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');

var SoCraTesActivity = beans.get('socratesActivity');
var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var notifications = beans.get('socratesNotifications');

var events = beans.get('events');
var SoCraTesEventStore = beans.get('SoCraTesEventStore');
var eventstore = beans.get('eventstore');

function setTimestamp(event, timestamp) {
  event.timestamp = timestamp;
  return event;
}

describe('Registration Service', function () {

  var socrates;
  var socratesActivity;
  var registrationTuple;

  var socratesES;

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
      url: 'socrates-url',
      isSoCraTes: true,
      startUnix: 1440687600,
      endUnix: 1440946800,
      resources: {
        single: {_canUnsubscribe: false, _limit: 10, _registrationOpen: true}
      }
    };

    socratesActivity = new SoCraTesActivity(socrates);

    socratesES = new SoCraTesEventStore();
    socratesES.state.socratesEvents = [
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
    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      if (url === 'wrongUrl') {
        return callback(new Error('Wrong URL!'));
      }
      if (url === 'socrates-url') {
        return callback(null, socratesActivity);
      }
      return callback(null);
    });
    sinon.stub(eventstore, 'getEventStore', function (url, callback) {
      if (url === 'wrongUrl') {
        return callback(new Error('Wrong URL!'));
      }
      if (url === 'socrates-url') {
        return callback(null, socratesES);
      }
      return callback(null);
    });

    sinon.stub(activitystore, 'saveActivity', function (activity, callback) { callback(); });
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
      expect(socratesES.reservationsAndParticipantsFor('single')).to.have.length(0);
      expect(socratesES.waitinglistReservationsAndParticipantsFor('single')).to.have.length(0);

      registrationService.startRegistration(registrationTuple, function (err) {
        expect(socratesES.reservationsAndParticipantsFor('single')).to.have.length(1);
        expect(socratesES.reservationsAndParticipantsFor('single')[0].event).to.eql('RESERVATION-WAS-ISSUED');
        expect(socratesES.reservationsAndParticipantsFor('single')[0].sessionID).to.eql('sessionId');
        expect(socratesES.reservationsAndParticipantsFor('single')[0].roomType).to.eql('single');
        expect(socratesES.reservationsAndParticipantsFor('single')[0].duration).to.eql(2);
        expect(socratesES.waitinglistReservationsAndParticipantsFor('single')).to.have.length(0);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if the registration data says so', function (done) {
      registrationTuple.duration = 'waitinglist';
      expect(socratesES.reservationsAndParticipantsFor('single')).to.have.length(0);
      expect(socratesES.waitinglistReservationsAndParticipantsFor('single')).to.have.length(0);

      registrationService.startRegistration(registrationTuple, function (err) {
        expect(socratesES.reservationsAndParticipantsFor('single')).to.have.length(0);
        expect(socratesES.waitinglistReservationsAndParticipantsFor('single')).to.have.length(1);
        expect(socratesES.waitinglistReservationsAndParticipantsFor('single')[0].event).to.eql('WAITINGLIST-RESERVATION-WAS-ISSUED');
        expect(socratesES.waitinglistReservationsAndParticipantsFor('single')[0].sessionID).to.eql('sessionId');
        expect(socratesES.waitinglistReservationsAndParticipantsFor('single')[0].desiredRoomTypes).to.eql(['single']);
        done(err);
      });
    });

  });

  describe('finishing the registration - general errors', function () {

    it('returns an error if fetching the activity produces an error', function (done) {
      registrationTuple.activityUrl = 'wrongUrl';
      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err) {
        expect(err.message).to.be('Wrong URL!');
        done();
      });
    });

    it('returns nothing if the activity cannot be found', function (done) {
      registrationTuple.activityUrl = 'unknown-url';
      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        done(err);
      });
    });

  });

  describe('finishing the registration - normal registration', function () {

    it('adds the registrant to the resource if he had a valid session entry', function (done) {
      socratesES.state.resourceEvents = [
        events.reservationWasIssued(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID)
      ];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(socratesES.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('adds the registrant to the resource if he has a waitinglist reservation and has a valid session entry, removing him from the waitinglist', function (done) {
      socratesES.state.resourceEvents = [
        events.waitinglistReservationWasIssued(registrationTuple.resourceName, registrationTuple.sessionID),
        events.reservationWasIssued(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID)
      ];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(socratesES.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('adds the registrant to the resource if he is on the waitinglist and has a valid session entry, removing him from the waitinglist', function (done) {
      socratesES.state.resourceEvents = [
        events.waitinglistParticipantWasRegistered(registrationTuple.resourceName, registrationTuple.sessionID, 'memberId'),
        events.reservationWasIssued(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID)
      ];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(socratesES.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('does not add the registrant to the resource if no sessionId entry exists', function (done) {
      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.registration_timed_out');
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.participantsByMemberIdFor('single')).to.eql({});
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('does not add the registrant to the resource if the sessionId entry is already expired', function (done) {
      socratesES.state.resourceEvents = [
        setTimestamp(events.reservationWasIssued(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID), moment().subtract(1, 'hours'))];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.registration_timed_out');
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.participantsByMemberIdFor('single')).to.eql({});
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('does not add the registrant to the resource if he is already registered', function (done) {
      socratesES.state.resourceEvents = [
        events.participantWasRegistered(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID, 'memberId')];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.already_registered');
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(socratesES.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });
  });

  describe('finishing the registration - waitinglist registration', function () {

    it('adds the registrant to the waitinglist if he had a valid session entry', function (done) {
      registrationTuple.duration = 'waitinglist';
      socratesES.state.resourceEvents = [
        events.waitinglistReservationWasIssued(registrationTuple.resourceName, registrationTuple.sessionID)];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.participantsByMemberIdFor('single')).to.eql({});
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(socratesES.waitinglistParticipantsByMemberIdFor('single'))).to.eql(['memberId']);
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if there is no reservation for the session id', function (done) {
      registrationTuple.duration = 'waitinglist';

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.waitinglist_registration_timed_out');
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.participantsByMemberIdFor('single')).to.eql({});
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if the reservation is already expired', function (done) {
      registrationTuple.duration = 'waitinglist';
      socratesES.state.resourceEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(registrationTuple.resourceName, registrationTuple.sessionID), moment().subtract(1, 'hours'))];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.waitinglist_registration_timed_out');
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.participantsByMemberIdFor('single')).to.eql({});
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if he is already registered', function (done) {
      socratesES.state.resourceEvents = [
        events.participantWasRegistered(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID, 'memberId'),
        events.waitinglistReservationWasIssued(registrationTuple.resourceName, registrationTuple.sessionID)
      ];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.already_registered');
        expect(socratesES.reservationsBySessionIdFor('single')).to.eql({});
        expect(R.keys(socratesES.participantsByMemberIdFor('single'))).to.eql(['memberId']);
        expect(socratesES.waitinglistReservationsBySessionIdFor('single')).to.eql({});
        expect(socratesES.waitinglistParticipantsByMemberIdFor('single')).to.eql({});
        done(err);
      });
    });

  });

});
