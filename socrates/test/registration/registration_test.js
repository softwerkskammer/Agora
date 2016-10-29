'use strict';

var request = require('supertest');
var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();
var moment = require('moment-timezone');
var R = require('ramda');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
const cache = conf.get('cache');
var userWithoutMember = require('../../testutil/userWithoutMember');

var groupsAndMembersService = beans.get('groupsAndMembersService');
var subscriberstore = beans.get('subscriberstore');
var notifications = beans.get('socratesNotifications');
var registrationService = beans.get('registrationService');

var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var events = beans.get('events');
var e = beans.get('eventConstants');
var GlobalEventStore = beans.get('GlobalEventStore');
var eventstore = beans.get('eventstore');

var createApp = require('../../testutil/testHelper')('socratesRegistrationApp').createApp;

var aShortTimeAgo = moment.tz().subtract(10, 'minutes');

function stripTimestampsAndJoins(someEvents) {
  return someEvents.map(event => {
    var newEvent = R.clone(event);
    delete newEvent.timestamp;
    delete newEvent.joinedSoCraTes;
    delete newEvent.joinedWaitinglist;
    return newEvent;
  });
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
    cache.flushAll();

    eventStore = new GlobalEventStore();
    eventStore.state.events = [
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
        .expect(/<form class="relaxed" id="participationinfoform" action="\/registration\/startRegistration" method="post"><fieldset class="disabled-text" disabled="disabled"/)
        .expect(/<button class="pull-right btn btn-primary" type="submit" disabled="disabled">Registration will open /)
        .expect(200, done);
    });

    it('shows different room options', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="single"\/><b>&nbsp; Single<\/b><\/label><\/div><\/th>/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="bed_in_double"\/><b>&nbsp; Double shared<\/b><\/label><\/div><\/th>/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="junior"\/><b>&nbsp; Junior \(exclusively\)<\/b><\/label><\/div><\/th>/, done);
    });

    it('shows an enabled registration table with initially disabled register button if the registration param is passed along', function (done) {
      appWithoutMember
        .get('/?registration=secretCode')
        .expect(/<form class="relaxed" id="participationinfoform" action="\/registration\/startRegistration" method="post"><fieldset>/)
        .expect(/<button class="pull-right btn btn-primary" type="submit" disabled="disabled">I really do want to participate!/)
        .expect(200, done);
    });

  });

  describe('when registration is opened', function () {

    it('shows an enabled registration table with initially disabled register button if the registration is open and nobody is logged in', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<form class="relaxed" id="participationinfoform" action="\/registration\/startRegistration" method="post"><fieldset>/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="bed_in_double"\/><b>&nbsp; Double shared<\/b><\/label><\/div><\/th>/)
        .expect(/<button class="pull-right btn btn-primary" type="submit" disabled="disabled">I really do want to participate!/)
        .expect(200, done);
    });

    it('displays the options (but disabled) if the user is registered', function (done) {
      /* eslint no-underscore-dangle: 0 */

      eventStore.state.events = eventStore.state.events.concat([
        events.registeredParticipantFromWaitinglist('bed_in_junior', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .expect(/<form class="relaxed" id="participationinfoform" action="\/registration\/startRegistration" method="post"><fieldset class="disabled-text" disabled="disabled"/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="single"\/><b>&nbsp; Single<\/b><\/label><\/div><\/th>/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="bed_in_double"\/><b>&nbsp; Double shared<\/b><\/label><\/div><\/th>/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="junior"\/><b>&nbsp; Junior \(exclusively\)<\/b><\/label><\/div><\/th>/)
        .expect(/<div class="btn pull-right btn btn-success">You are already registered\./, done);
    });

  });

  describe('to support the search for a roommate', function () {

    it('does not display the roommate banner on the registration page when the user is not logged in', function (done) {
      appWithoutMember
        .get('/')
        .end(function (err, res) {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is not subscribed to SoCraTes', function (done) {
      appWithSocratesMember
        .get('/')
        .end(function (err, res) {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is subscribed in a single-bed room', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.registeredParticipantFromWaitinglist('single', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .end(function (err, res) {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is subscribed in a junior room', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.registeredParticipantFromWaitinglist('junior', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .end(function (err, res) {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is on the waitinglist for a double-bed room', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.waitinglistParticipantWasRegistered(['bed_in_double'], 2, 'some-session-id', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .end(function (err, res) {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is on the waitinglist for a shared junior room', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.waitinglistParticipantWasRegistered(['bed_in_junior'], 2, 'some-session-id', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .end(function (err, res) {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('displays the roommate banner on the registration page when the user is subscribed for a double-bed room', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.registeredParticipantFromWaitinglist('bed_in_double', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .expect(/Still looking for a roommate?/, done);
    });

    it('displays the roommate banner on the registration page when the user is subscribed for a shared junior room', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.registeredParticipantFromWaitinglist('bed_in_junior', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .expect(/Still looking for a roommate?/, done);
    });

    it('does not display the roommate banner on the registration page when the user is subscribed for a double-bed room and already has a roommate', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.registeredParticipantFromWaitinglist('bed_in_double', 'some-duration', 'other-member-id', aShortTimeAgo),
        events.registeredParticipantFromWaitinglist('bed_in_double', 'some-duration', 'memberId2', aShortTimeAgo),
        events.roomPairWasAdded('bed_in_double', 'other-member-id', 'memberId2')]);

      appWithSocratesMember
        .get('/')
        .end(function (err, res) {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is subscribed for a shared junior room and already has a roommate', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.registeredParticipantFromWaitinglist('bed_in_junior', 'some-duration', 'other-member-id', aShortTimeAgo),
        events.registeredParticipantFromWaitinglist('bed_in_junior', 'some-duration', 'memberId2', aShortTimeAgo),
        events.roomPairWasAdded('bed_in_junior', 'other-member-id', 'memberId2')]);

      appWithSocratesMember
        .get('/')
        .end(function (err, res) {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
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

    it('redirects to the participate form page when a room is selected (full or not)', function (done) {
      appWithSocratesMember
        .post('/startRegistration')
        .send('roomsOptions=single&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {
          expect(eventStoreSave.called).to.be(true);
          done(err);
        });
    });
  });

  describe('startRegistration', function () {
    it('passes null as memberId if nobody is logged in', function (done) {
      const startRegistration = sinon.spy(registrationService, 'startRegistration');

      appWithoutMember
        .post('/startRegistration')
        .send('roomsOptions=single&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {
          expect(startRegistration.firstCall.args[1]).to.be(null);
          done(err);
        });
    });

    it('passes the memberId of the logged-in user', function (done) {
      const startRegistration = sinon.spy(registrationService, 'startRegistration');

      appWithSocratesMember
        .post('/startRegistration')
        .send('roomsOptions=single&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {
          expect(startRegistration.firstCall.args[1]).to.be('memberId2');
          done(err);
        });
    });

  });

  describe('startRegistration splits up the form params', function () {

    it('for a single waitinglist registration', function (done) {
      const startRegistration = sinon.spy(registrationService, 'startRegistration');

      appWithSocratesMember
        .post('/startRegistration')
        .send('roomsOptions=single&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {

          const registrationTuple = startRegistration.firstCall.args[0];
          expect(registrationTuple.roomType).to.eql(undefined);
          expect(registrationTuple.duration).to.eql('3');
          expect(registrationTuple.desiredRoomTypes).to.eql(['single']);
          done(err);
        });
    });

    it('for multiple waitinglist registrations', function (done) {
      const startRegistration = sinon.spy(registrationService, 'startRegistration');

      appWithSocratesMember
        .post('/startRegistration')
        .send('roomsOptions=single&roomsOptions=bed_in_double&roomsOptions=junior&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {

          const registrationTuple = startRegistration.firstCall.args[0];
          expect(registrationTuple.roomType).to.eql(undefined);
          expect(registrationTuple.duration).to.eql('3');
          expect(registrationTuple.desiredRoomTypes).to.eql(['single', 'bed_in_double', 'junior']);
          done(err);
        });
    });
  });

  describe('submission of the participate form to become a waitinglist participant', function () {
    it('is accepted when a waitinglist option is selected', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.waitinglistReservationWasIssued(['single'], 2, 'session-id', 'memberId', aShortTimeAgo)
      ]);

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('duration=2')
        .send('desiredRoomTypes=single')
        .send('country=ZZ')
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
          expect(stripTimestampsAndJoins(eventStore.state.events)).to.eql([
            {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 0},
            {event: e.ROOM_QUOTA_WAS_SET, roomType: 'bed_in_double', quota: 10},
            {event: e.ROOM_QUOTA_WAS_SET, roomType: 'junior', quota: 10},
            {event: e.ROOM_QUOTA_WAS_SET, roomType: 'bed_in_junior', quota: 10},
            {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionId: 'session-id', desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId'},
            {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', desiredRoomTypes: ['single'], duration: 2, memberId: 'memberId2'}
          ]);
          done(err);
        });
    });
  });

  describe('submission of the participate form to book a room and to become a waitinglist participant', function () {
    it('is accepted when a room and at least a waitinglist option is selected', function (done) {
      eventStore.state.events = eventStore.state.events.concat([
        events.waitinglistReservationWasIssued(['single', 'junior'], 2, 'session-id', 'memberId', aShortTimeAgo)
      ]);

      appWithSocratesMemberAndFixedSessionId
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('duration=2')
        .send('desiredRoomTypes=single,junior')
        .send('country=UU')
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
          expect(stripTimestampsAndJoins(eventStore.state.events)).to.eql([
            {event: e.ROOM_QUOTA_WAS_SET, roomType: 'single', quota: 0},
            {event: e.ROOM_QUOTA_WAS_SET, roomType: 'bed_in_double', quota: 10},
            {event: e.ROOM_QUOTA_WAS_SET, roomType: 'junior', quota: 10},
            {event: e.ROOM_QUOTA_WAS_SET, roomType: 'bed_in_junior', quota: 10},
            {event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionId: 'session-id', desiredRoomTypes: ['single', 'junior'], duration: 2, memberId: 'memberId'},
            {event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionId: 'session-id', desiredRoomTypes: ['single', 'junior'], duration: 2, memberId: 'memberId2'}
          ]);
          done(err);
        });
    });
  });

});
