'use strict';

const request = require('supertest');
const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();
const moment = require('moment-timezone');
const R = require('ramda');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const cache = conf.get('cache');
const userWithoutMember = require('../../testutil/userWithoutMember');

const groupsAndMembersService = beans.get('groupsAndMembersService');
const subscriberstore = beans.get('subscriberstore');
const notifications = beans.get('socratesNotifications');
const registrationService = beans.get('registrationService');

const Member = beans.get('member');
const Subscriber = beans.get('subscriber');

const events = beans.get('events');
const e = beans.get('eventConstants');
const GlobalEventStore = beans.get('GlobalEventStore');
const eventstore = beans.get('eventstore');

const createApp = require('../../testutil/testHelper')('socratesRegistrationApp').createApp;

const aShortTimeAgo = moment.tz().subtract(10, 'minutes');

function stripTimestampsAndJoins(someEvents) {
  return someEvents.map(event => {
    const newEvent = R.clone(event);
    delete newEvent.timestamp;
    delete newEvent.joinedSoCraTes;
    delete newEvent.joinedWaitinglist;
    return newEvent;
  });
}

describe('SoCraTes registration application', () => {
  /* eslint camelcase: 0 */
  const appWithoutMember = request(createApp({middlewares: [userWithoutMember]}));

  const socratesMember = new Member({
    id: 'memberId2',
    nickname: 'nini',
    email: 'x@y.com',
    site: 'http://my.blog',
    firstname: 'Petra',
    lastname: 'Meier',
    authentications: [],
    socratesOnly: true
  });

  const appWithSocratesMember = request(createApp({member: socratesMember}));
  const appWithSocratesMemberAndFixedSessionId = request(createApp({member: socratesMember, sessionID: 'session-id'}));

  let eventStoreSave;

  let listOfEvents;

  beforeEach(() => {
    cache.flushAll();

    listOfEvents = [
      events.roomQuotaWasSet('single', 0),
      events.roomQuotaWasSet('bed_in_double', 10),
      events.roomQuotaWasSet('junior', 10),
      events.roomQuotaWasSet('bed_in_junior', 10)
    ];

    conf.addProperties({registrationOpensAt: moment().subtract(10, 'days').format()}); // already opened
    sinon.stub(groupsAndMembersService, 'updateAndSaveSubmittedMemberWithoutSubscriptions',
      (sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) => { callback(); });
    eventStoreSave = sinon.stub(eventstore, 'saveEventStore', (store, callback) => { callback(); });
    sinon.stub(subscriberstore, 'getSubscriber', (memberId, callback) => { callback(null, new Subscriber({})); });
    sinon.stub(subscriberstore, 'saveSubscriber', (subscriber, callback) => { callback(); });

    sinon.stub(eventstore, 'getEventStore', (url, callback) => {
      callback(null, new GlobalEventStore({
        url,
        events: listOfEvents
      }));
    });

    sinon.stub(notifications, 'newParticipant');
    sinon.stub(notifications, 'newWaitinglistEntry');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('before registration is opened', () => {
    beforeEach(() => {
      conf.addProperties({registrationOpensAt: moment().add(10, 'days').format()}); // not opened yet
    });

    it('shows a disabled registration table and the "registration date button"', done => {
      appWithoutMember
        .get('/')
        .expect(/<form class="relaxed" id="participationinfoform" action="\/registration\/startRegistration" method="post"><fieldset class="disabled-text" disabled="disabled"/)
        .expect(/<button class="pull-right btn btn-primary" type="submit" disabled="disabled">Registration will open /)
        .expect(200, done);
    });

    it('shows different room options', done => {
      appWithoutMember
        .get('/')
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="single"\/><b>&nbsp; Single<\/b><\/label><\/div><\/th>/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="bed_in_double"\/><b>&nbsp; Double shared<\/b><\/label><\/div><\/th>/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="junior"\/><b>&nbsp; Junior \(exclusively\)<\/b><\/label><\/div><\/th>/, done);
    });

  });

  describe('when registration is opened', () => {

    it('shows an enabled registration table with initially disabled register button if the registration is open and nobody is logged in', done => {
      appWithoutMember
        .get('/')
        .expect(/<form class="relaxed" id="participationinfoform" action="\/registration\/startRegistration" method="post"><fieldset>/)
        .expect(/<th><div class="radio-inline"><label><input type="checkbox" name="roomsOptions" value="bed_in_double"\/><b>&nbsp; Double shared<\/b><\/label><\/div><\/th>/)
        .expect(/<button class="pull-right btn btn-primary" type="submit" disabled="disabled">I really do want to participate!/)
        .expect(200, done);
    });

    it('displays the options (but disabled) if the user is registered', done => {
      /* eslint no-underscore-dangle: 0 */

      listOfEvents = listOfEvents.concat([
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

  describe('to support the search for a roommate', () => {

    it('does not display the roommate banner on the registration page when the user is not logged in', done => {
      appWithoutMember
        .get('/')
        .end((err, res) => {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is not subscribed to SoCraTes', done => {
      appWithSocratesMember
        .get('/')
        .end((err, res) => {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is subscribed in a single-bed room', done => {
      listOfEvents = listOfEvents.concat([
        events.registeredParticipantFromWaitinglist('single', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .end((err, res) => {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is subscribed in a junior room', done => {
      listOfEvents = listOfEvents.concat([
        events.registeredParticipantFromWaitinglist('junior', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .end((err, res) => {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is on the waitinglist for a double-bed room', done => {
      listOfEvents = listOfEvents.concat([
        events.waitinglistParticipantWasRegistered(['bed_in_double'], 2, 'some-session-id', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .end((err, res) => {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is on the waitinglist for a shared junior room', done => {
      listOfEvents = listOfEvents.concat([
        events.waitinglistParticipantWasRegistered(['bed_in_junior'], 2, 'some-session-id', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .end((err, res) => {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('displays the roommate banner on the registration page when the user is subscribed for a double-bed room', done => {
      listOfEvents = listOfEvents.concat([
        events.registeredParticipantFromWaitinglist('bed_in_double', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .expect(/Still looking for a roommate?/, done);
    });

    it('displays the roommate banner on the registration page when the user is subscribed for a shared junior room', done => {
      listOfEvents = listOfEvents.concat([
        events.registeredParticipantFromWaitinglist('bed_in_junior', 'some-duration', 'memberId2', aShortTimeAgo)]);

      appWithSocratesMember
        .get('/')
        .expect(/Still looking for a roommate?/, done);
    });

    it('does not display the roommate banner on the registration page when the user is subscribed for a double-bed room and already has a roommate', done => {
      listOfEvents = listOfEvents.concat([
        events.registeredParticipantFromWaitinglist('bed_in_double', 'some-duration', 'other-member-id', aShortTimeAgo),
        events.registeredParticipantFromWaitinglist('bed_in_double', 'some-duration', 'memberId2', aShortTimeAgo),
        events.roomPairWasAdded('bed_in_double', 'other-member-id', 'memberId2')]);

      appWithSocratesMember
        .get('/')
        .end((err, res) => {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });

    it('does not display the roommate banner on the registration page when the user is subscribed for a shared junior room and already has a roommate', done => {
      listOfEvents = listOfEvents.concat([
        events.registeredParticipantFromWaitinglist('bed_in_junior', 'some-duration', 'other-member-id', aShortTimeAgo),
        events.registeredParticipantFromWaitinglist('bed_in_junior', 'some-duration', 'memberId2', aShortTimeAgo),
        events.roomPairWasAdded('bed_in_junior', 'other-member-id', 'memberId2')]);

      appWithSocratesMember
        .get('/')
        .end((err, res) => {
          expect(res.text).to.not.contain('Still looking for a roommate?');
          done(err);
        });
    });
  });

  describe('pressing the registration button on the registration page', () => {

    it('redirects to the registration page when no room is selected', done => {
      appWithSocratesMember
        .post('/startRegistration')
        .expect(302)
        .expect('location', '/registration', err => {
          expect(eventStoreSave.called).to.be(false);
          done(err);
        });
    });

    it('redirects to the participate form page when a room is selected (full or not)', done => {
      appWithSocratesMember
        .post('/startRegistration')
        .send('roomsOptions=single&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', err => {
          expect(eventStoreSave.called).to.be(true);
          done(err);
        });
    });
  });

  describe('startRegistration', () => {
    it('passes null as memberId if nobody is logged in', done => {
      const startRegistration = sinon.spy(registrationService, 'startRegistration');

      appWithoutMember
        .post('/startRegistration')
        .send('roomsOptions=single&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', err => {
          expect(startRegistration.firstCall.args[1]).to.be(null);
          done(err);
        });
    });

    it('passes the memberId of the logged-in user', done => {
      const startRegistration = sinon.spy(registrationService, 'startRegistration');

      appWithSocratesMember
        .post('/startRegistration')
        .send('roomsOptions=single&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', err => {
          expect(startRegistration.firstCall.args[1]).to.be('memberId2');
          done(err);
        });
    });

  });

  describe('startRegistration splits up the form params', () => {

    it('for a single waitinglist registration', done => {
      const startRegistration = sinon.spy(registrationService, 'startRegistration');

      appWithSocratesMember
        .post('/startRegistration')
        .send('roomsOptions=single&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', err => {

          const registrationTuple = startRegistration.firstCall.args[0];
          expect(registrationTuple.roomType).to.eql(undefined);
          expect(registrationTuple.duration).to.eql('3');
          expect(registrationTuple.desiredRoomTypes).to.eql(['single']);
          done(err);
        });
    });

    it('for multiple waitinglist registrations', done => {
      const startRegistration = sinon.spy(registrationService, 'startRegistration');

      appWithSocratesMember
        .post('/startRegistration')
        .send('roomsOptions=single&roomsOptions=bed_in_double&roomsOptions=junior&nightsOption=3')
        .expect(302)
        .expect('location', '/registration/participate', err => {

          const registrationTuple = startRegistration.firstCall.args[0];
          expect(registrationTuple.roomType).to.eql(undefined);
          expect(registrationTuple.duration).to.eql('3');
          expect(registrationTuple.desiredRoomTypes).to.eql(['single', 'bed_in_double', 'junior']);
          done(err);
        });
    });
  });

  describe('submission of the participate form to become a waitinglist participant', () => {
    it('is accepted when a waitinglist option is selected', done => {
      listOfEvents = listOfEvents.concat([
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
        .expect('location', '/registration', err => {
          expect(eventStoreSave.called).to.be(true);
          expect(stripTimestampsAndJoins(eventStoreSave.firstCall.args[0].state.events)).to.eql([
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

  describe('submission of the participate form to book a room and to become a waitinglist participant', () => {
    it('is accepted when a room and at least a waitinglist option is selected', done => {
      listOfEvents = listOfEvents.concat([
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
        .expect('location', '/registration', err => {
          expect(eventStoreSave.called).to.be(true);
          expect(stripTimestampsAndJoins(eventStoreSave.firstCall.args[0].state.events)).to.eql([
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
