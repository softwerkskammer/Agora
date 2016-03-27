'use strict';

var request = require('supertest');
var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();
var moment = require('moment-timezone');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');

var groupsAndMembersService = beans.get('groupsAndMembersService');
var subscriberstore = beans.get('subscriberstore');
var notifications = beans.get('socratesNotifications');

var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var events = beans.get('events');
var e = beans.get('eventConstants');
var GlobalEventStore = beans.get('GlobalEventStore');
var eventstore = beans.get('eventstore');

var createApp = require('../../testutil/testHelper')('socratesRegistrationApp').createApp;

function setTimestamp(event, timestamp) {
  event.timestamp = timestamp;
  return event;
}

describe('SoCraTes registration application', function () {
  /* eslint camelcase: 0 */
  var appWithoutMember = request(createApp({middlewares: [userWithoutMember]}));

  var socratesMember = new Member({
    id: 'memberId2',
    nickname: 'nini',
    email: 'x@y.com',
    site: 'http://my.blog',
    firstname: 'Petra',
    lastname: 'Meier',
    authentications: [],
    socratesOnly: true
  });

  var appWithSocratesMember = request(createApp({member: socratesMember}));
  var appWithSocratesMemberAndFixedSessionId = request(createApp({member: socratesMember, sessionID: 'session-id'}));

  var eventStoreSave;

  var eventStore;

  beforeEach(function () {
    eventStore = new GlobalEventStore();
    eventStore.state.socratesEvents = [
      events.roomQuotaWasSet('single', 0),
      events.roomQuotaWasSet('bed_in_double', 10),
      events.roomQuotaWasSet('junior', 10),
      events.roomQuotaWasSet('bed_in_junior', 10)
    ];

    conf.addProperties({registrationOpensAt: moment().subtract(10, 'days').format()}); // already opened
    sinon.stub(groupsAndMembersService, 'updateAndSaveSubmittedMemberWithoutSubscriptions',
      function (sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) { callback(); });
    eventStoreSave = sinon.stub(eventstore, 'saveEventStore', function (store, callback) { callback(); });
    sinon.stub(subscriberstore, 'getSubscriber', function (memberId, callback) { callback(null, new Subscriber({})); });
    sinon.stub(subscriberstore, 'saveSubscriber', function (subscriber, callback) { callback(); });

    sinon.stub(eventstore, 'getEventStore', function (url, callback) { callback(null, eventStore); });

    sinon.stub(notifications, 'newParticipant');
    sinon.stub(notifications, 'newWaitinglistEntry');
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('before registration is opened', function () {
    beforeEach(function () {
      conf.addProperties({registrationOpensAt: moment().add(10, 'days').format()}); // not opened yet
      conf.addProperties({registrationParam: 'secretCode'}); // allows for pre-registration
    });

    it('shows a disabled registration table and the "registration date button"', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<form id="participationinfoform" action="\/registration\/startRegistration" method="post" class="relaxed"><fieldset disabled="disabled"/)
        .expect(/<button type="submit" disabled="disabled" class="pull-right btn btn-primary">Registration will open /)
        .expect(200, done);
    });

    it('does not display that options 1 to 3 are not available', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<th>Single<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="single,2"/)
        .expect(/<th>Double shared<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="bed_in_double,2"/)
        .expect(/<th>Junior \(exclusively\)<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="junior,2"/, done);
    });

    it('shows an enabled registration table with initially disabled register button if the registration param is passed along', function (done) {
      appWithoutMember
        .get('/?registration=secretCode')
        .expect(/<form id="participationinfoform" action="\/registration\/startRegistration" method="post" class="relaxed"><fieldset>/)
        .expect(/<th>Junior shared<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="bed_in_junior,2"/)
        .expect(/<button type="submit" disabled="disabled" class="pull-right btn btn-primary">I really do want to participate!/)
        .expect(200, done);
    });

  });

  describe('when registration is opened', function () {

    it('shows an enabled registration table with initially disabled register button if the registration is open and nobody is logged in', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<form id="participationinfoform" action="\/registration\/startRegistration" method="post" class="relaxed"><fieldset>/)
        .expect(/<th>Junior shared<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="bed_in_junior,2"/)
        .expect(/<button type="submit" disabled="disabled" class="pull-right btn btn-primary">I really do want to participate!/)
        .expect(200, done);
    });

    it('displays that only option 1 has a waitinglist button if nobody is logged in', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<th>Double shared<\/th>/)
        .expect(/<th>Junior shared<\/th>/)
        .expect(/<th>Junior \(exclusively\)<\/th>/)
        .expect(/<th>Single<div class="radio-inline/, done);
    });

    it('displays the options (but disabled) if the user is registered', function (done) {
      /* eslint no-underscore-dangle: 0 */

      eventStore.state.registrationEvents = [
        events.participantWasRegistered('bed_in_junior', 'some-duration', 'some-session-id', 'memberId2')];

      appWithSocratesMember
        .get('/')
        .expect(/<form id="participationinfoform" action="\/registration\/startRegistration" method="post" class="relaxed"><fieldset disabled="disabled"/)
        .expect(/<th>Single<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="single,2"/)
        .expect(/<th>Double shared<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="bed_in_double,2"/)
        .expect(/<th>Junior \(exclusively\)<\/th><td class="text-center"><div class="radio-inline"><label><input type="radio" name="nightsOptions" value="junior,2"/)
        .expect(/<div class="btn pull-right btn btn-success">You are already registered\./, done);
    });

  });

  describe('pressing the registration button on the registration page', function () {

    it('redirects to the registration page when no room is selected', function (done) {
      appWithSocratesMember
        .post('/startRegistration')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(false);
          done(err);
        });
    });

    it('redirects to the registration page when a room is selected that is full', function (done) {
      appWithSocratesMember
        .post('/startRegistration')
        .send('nightsOptions=single,3')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          done(err);
        });
    });

    it('redirects to the participate form page when a room is selected that is not full', function (done) {
      appWithSocratesMember
        .post('/startRegistration')
        .send('nightsOptions=bed_in_double,3')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {
          expect(eventStoreSave.called).to.be(true);
          done(err);
        });
    });

    it('redirects to the participate form page when a waitinglist option is selected (especially when the corresponding room is full)', function (done) {
      appWithSocratesMember
        .post('/startRegistration')
        .send('nightsOptions=single,waitinglist&nightsOptions=bed_in_double,waitinglist')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {
          expect(eventStoreSave.called).to.be(true);
          done(err);
        });
    });
  });

  describe('submission of the participate form to become a participant', function () {

    it('is accepted when a room is selected', function (done) {
      eventStore.state.registrationEvents = [
        events.reservationWasIssued('single', 5, 'session-id', 'memberId2')];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=single')
        .send('duration=5')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.RESERVATION_WAS_ISSUED);
          expect(eventStore.state.registrationEvents[1].event).to.eql(e.PARTICIPANT_WAS_REGISTERED);
          done(err);
        });

    });

    it('is still accepted as participant even when the timeout is expired, if there is enough space in the resource', function (done) {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued('junior', 'session-id', 'memberId2'), moment().subtract(1, 'hours'))];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=junior')
        .send('duration=3')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.RESERVATION_WAS_ISSUED);
          expect(eventStore.state.registrationEvents[1].event).to.eql(e.PARTICIPANT_WAS_REGISTERED);
          done(err);
        });
    });

    it('is still accepted as participant even when there is no reservation, if there is enough space in the resource', function (done) {
      eventStore.state.registrationEvents = [];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=junior')
        .send('duration=3')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.PARTICIPANT_WAS_REGISTERED);
          done(err);
        });
    });

    it('is not accepted as participant when the timeout is expired and there is not enough space in the resource', function (done) {
      eventStore.state.registrationEvents = [
        setTimestamp(events.reservationWasIssued('single', 'session-id', 'memberId2'), moment().subtract(1, 'hours'))];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=single')
        .send('duration=3')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.RESERVATION_WAS_ISSUED);
          expect(eventStore.state.registrationEvents[1].event).to.eql(e.DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE);
          done(err);
        });
    });

    it('is not accepted as participant when there is no reservation and there is not enough space in the resource', function (done) {
      eventStore.state.registrationEvents = [];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=single')
        .send('duration=3')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE);
          done(err);
        });
    });

    it('is not accepted if already registered', function (done) {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered('junior', 5, 'session-id', 'memberId2')
      ];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=junior')
        .send('duration=5')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.PARTICIPANT_WAS_REGISTERED);
          expect(eventStore.state.registrationEvents[1].event).to.eql(e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME);
          done(err);
        });

    });

  });

  describe('submission of the participate form to become a waitinglist participant', function () {
    it('is accepted when a waitinglist option is selected', function (done) {
      eventStore.state.registrationEvents = [
        events.waitinglistReservationWasIssued(['single'], 'session-id', 'memberId2')];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('desiredRoomTypes=single')
        .send('duration=waitinglist')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.WAITINGLIST_RESERVATION_WAS_ISSUED);
          expect(eventStore.state.registrationEvents[1].event).to.eql(e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED);
          done(err);
        });
    });

    it('is still accepted to the waitinglist even when the timeout is expired', function (done) {
      eventStore.state.registrationEvents = [
        setTimestamp(events.waitinglistReservationWasIssued(['single'], 'session-id', 'memberId2'), moment().subtract(1, 'hours'))];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('desiredRoomTypes=single')
        .send('duration=waitinglist')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.WAITINGLIST_RESERVATION_WAS_ISSUED);
          expect(eventStore.state.registrationEvents[1].event).to.eql(e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED);
          done(err);
        });
    });

    it('is not accepted to the waitinglist a second time', function (done) {
      eventStore.state.registrationEvents = [
        events.waitinglistParticipantWasRegistered('single', 'session-id', 'memberId2')];

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=junior')
        .send('duration=waitinglist')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('hasParticipationInformation=true')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(eventStoreSave.called).to.be(true);
          expect(eventStore.state.registrationEvents[0].event).to.eql(e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED);
          expect(eventStore.state.registrationEvents[1].event).to.eql(e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME);
          done(err);
        });
    });
  });

});
