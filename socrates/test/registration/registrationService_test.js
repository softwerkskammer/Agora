'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must');
var moment = require('moment-timezone');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');

var registrationService = beans.get('registrationService');

var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');

var SoCraTesActivity = beans.get('socratesActivity');
var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var notifications = beans.get('socratesNotifications');

describe('Registration Service', function () {

  var socrates;
  var socratesActivity;
  var registrationTuple;

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
      description: 'Coolest event ever :-)',
      location: 'Right next door',
      url: 'socrates-url',
      isSoCraTes: true,
      startUnix: 1440687600,
      endUnix: 1440946800,
      owner: {nickname: "ownerNick"},
      assignedGroup: "assignedGroup",
      group: {groupLongName: "longName"},
      resources: {
        single: {_canUnsubscribe: false, _limit: 10, _registrationOpen: true}
      }
    };

    socratesActivity = new SoCraTesActivity(socrates);

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

    sinon.stub(activitystore, 'saveActivity', function (activity, callback) { callback(); });
    sinon.stub(subscriberstore, 'saveSubscriber', function (subscriber, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

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
      expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
      expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);

      registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql(['SessionID:sessionId']);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if the registration data says so and if a waitinglist is present', function (done) {
      registrationTuple.duration = 'waitinglist';
      socrates.resources.single._waitinglist = [];
      expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
      expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);

      registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(1);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()[0].state._memberId).to.eql('SessionID:sessionId');
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if the registration data says so but no waitinglist is present', function (done) {
      registrationTuple.duration = 'waitinglist';
      socrates.resources.single._waitinglist = undefined;
      expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
      expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);

      registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
        done(err);
      });
    });

  });

  describe('finishing the registration', function () {

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

    it('does not add the registrant to the resource if no sessionId entry exists', function (done) {
      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.registration_timed_out');
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
        done(err);
      });
    });

    it('does not add the registrant to the resource if the sessionId entry is already expired', function (done) {
      socrates.resources.single._registeredMembers = [{
        memberId: 'SessionID:sessionId',
        expiresAt: moment().subtract(1, 'hours')
      }];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.registration_timed_out');
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if the sessionId entry is already expired', function (done) {
      registrationTuple.duration = 'waitinglist';
      socrates.resources.single._waitinglist = [{
        _memberId: 'SessionID:sessionId',
        expiresAt: moment().subtract(1, 'hours')
      }];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.waitinglist_registration_timed_out');
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
        done(err);
      });
    });

    it('does not add the registrant to the resource if he is already registered', function (done) {
      socrates.resources.single._registeredMembers = [
        {
          memberId: 'memberId'
        },
        {
          memberId: 'SessionID:sessionId',
          expiresAt: moment().add(1, 'hours')
        }];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.already_registered');
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql(['memberId', 'SessionID:sessionId']);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if he is already registered', function (done) {
      socrates.resources.single._registeredMembers = [
        {
          memberId: 'memberId'
        }];
      registrationTuple.duration = 'waitinglist';
      socrates.resources.single._waitinglist = [{
        _memberId: 'SessionID:sessionId',
        expiresAt: moment().add(1, 'hours')
      }];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.be('message.title.problem');
        expect(statusText).to.be('activities.already_registered');
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql(['memberId']);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(1);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()[0].state._memberId).to.eql('SessionID:sessionId');
        done(err);
      });
    });

    it('adds the registrant to the resource if he had a valid session entry, removing him from the waitinglist if necessary', function (done) {
      socrates.resources.single._registeredMembers = [
        {
          memberId: 'SessionID:sessionId',
          expiresAt: moment().add(1, 'hours')
        }];
      socrates.resources.single._waitinglist = [{ _memberId: 'memberId' }];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql(['memberId']);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(0);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if he had a valid session entry', function (done) {
      registrationTuple.duration = 'waitinglist';
      socrates.resources.single._waitinglist = [
        {
          _memberId: 'SessionID:sessionId',
          expiresAt: moment().add(1, 'hours')
        }
      ];

      registrationService.saveRegistration('memberId', 'sessionId', registrationTuple, function (err, statusTitle, statusText) {
        expect(statusTitle).to.not.exist();
        expect(statusText).to.not.exist();
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.have.length(0);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.have.length(1);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()[0].state._memberId).to.eql('memberId');
        done(err);
      });
    });


  });

});