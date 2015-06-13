'use strict';

var request = require('supertest');
var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();
var moment = require('moment-timezone');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');

var activitiesService = beans.get('activitiesService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var subscriberService = beans.get('subscriberService');
var subscriberstore = beans.get('subscriberstore');
var activitystore = beans.get('activitystore');
var notifications = beans.get('socratesNotifications');

var Member = beans.get('member');
var Subscriber = beans.get('subscriber');
var SoCraTesActivity = beans.get('socratesActivityExtended');
var createApp = require('../../testutil/testHelper')('socratesRegistrationApp').createApp;

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

  var socrates;
  var socratesActivity;
  var activitySave;

  beforeEach(function () {
    socrates = {
      id: 'socratesId',
      title: 'SoCraTes',
      description: 'Coolest event ever :-)',
      location: 'Right next door',
      url: 'socrates-url',
      isSoCraTes: true,
      startUnix: 1440687600,
      endUnix: 1440946800,
      owner: {nickname: 'ownerNick'},
      assignedGroup: 'assignedGroup',
      group: {groupLongName: 'longName'},
      resources: {
        single: {_canUnsubscribe: false, _limit: 0, _position: 2, _registrationOpen: true, _waitinglist: []}, // no capacity
        bed_in_double: {_canUnsubscribe: false, _limit: 10, _position: 3, _registrationOpen: false, _waitinglist: []}, // not opened
        junior: {_canUnsubscribe: false, _limit: 10, _position: 4, _registrationOpen: false}, // not opened, no waitinglist
        bed_in_junior: {_canUnsubscribe: false, _limit: 10, _position: 5, _registrationOpen: true}
      }
    };
    socratesActivity = new SoCraTesActivity(socrates);

    conf.addProperties({registrationOpensAt: moment().subtract(10, 'days').format()}); // already opened
    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants', function (activityUrl, callback) { callback(null, socratesActivity); });
    sinon.stub(subscriberService, 'createSubscriberIfNecessaryFor', function (userId, callback) { callback(); });
    sinon.stub(groupsAndMembersService, 'updateAndSaveSubmittedMemberWithoutSubscriptions',
      function (sessionUser, memberformData, accessrights, notifyNewMemberRegistration, callback) { callback(); });
    sinon.stub(activitystore, 'getActivity', function (activityUrl, callback) { callback(null, socratesActivity); });
    activitySave = sinon.stub(activitystore, 'saveActivity', function (activity, callback) { callback(); });
    sinon.stub(subscriberstore, 'getSubscriber', function (memberId, callback) { callback(null, new Subscriber({})); });
    sinon.stub(subscriberstore, 'saveSubscriber', function (subscriber, callback) { callback(); });

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

    it('displays that options 1 and 2 have a waitinglist button if nobody is logged in', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<th>Double shared<div class="radio-inline/)
        .expect(/<th>Single<div class="radio-inline/, done);
    });

    it('displays that option 3 does not have a waitinglist button if nobody is logged in', function (done) {
      appWithoutMember
        .get('/')
        .expect(/<th>Junior \(exclusively\)<\/th>/, done);
    });

    it('displays the options (but disabled) if the user is registered', function (done) {
      /* eslint no-underscore-dangle: 0 */

      socrates.resources.bed_in_junior._registeredMembers = [{memberId: 'memberId2'}];

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
          expect(activitySave.called).to.be(false);
          done(err);
        });
    });

    it('redirects to the participate form page when a room is selected', function (done) {
      appWithSocratesMember
        .post('/startRegistration')
        .send('nightsOptions=single,3')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {
          expect(activitySave.called).to.be(true);
          done(err);
        });
    });

    it('redirects to the participate form page when a waitinglist option is selected', function (done) {
      appWithSocratesMember
        .post('/startRegistration')
        .send('nightsOptions=single,waitinglist')
        .expect(302)
        .expect('location', '/registration/participate', function (err) {
          expect(activitySave.called).to.be(true);
          done(err);
        });
    });
  });

  describe('submission of the participate form', function () {

    it('is accepted when a room is selected', function (done) {
      socratesActivity.hasValidReservationFor = function () { return true; };

      appWithSocratesMember
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=single')
        .send('duration=5')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('question1=Dunno...')
        .send('question2=Nothing.')
        .send('question3=Why are you so curious?')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/payment/socrates', function (err) {
          expect(activitySave.called).to.be(true);
          done(err);
        });

    });

    it('is accepted when a waitinglist option is selected', function (done) {
      socratesActivity.hasValidReservationFor = function () { return true; };

      appWithSocratesMember
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=single')
        .send('duration=waitinglist')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('question1=Dunno...')
        .send('question2=Nothing.')
        .send('question3=Why are you so curious?')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(activitySave.called).to.be(true);
          done(err);
        });
    });

    it('is denied when the timeout is expired', function (done) {
      socratesActivity.hasValidReservationFor = function () { return false; };

      appWithSocratesMember
        .post('/completeRegistration')
        .send('activityUrl=socrates-url')
        .send('resourceName=single')
        .send('duration=waitinglist')
        .send('homeAddress=At home')
        .send('billingAddress=')
        .send('tShirtSize=XXXL')
        .send('remarks=vegan')
        .send('roommate=My buddy')
        .send('question1=Dunno...')
        .send('question2=Nothing.')
        .send('question3=Why are you so curious?')
        .send('previousNickname=Nick&nickname=Nick')
        .send('previousEmail=me@you.com&email=me@you.com')
        .send('firstname=Peter&lastname=Miller')
        .expect(302)
        .expect('location', '/registration', function (err) {
          expect(activitySave.called).to.be(false);
          done(err);
        });
    });

  });

});
