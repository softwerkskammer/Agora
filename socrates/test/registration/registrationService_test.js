'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must');
var moment = require('moment-timezone');
var _ = require('lodash');

var beans = require('../../testutil/configureForTest').get('beans');

var registrationService = beans.get('registrationService');

var activitystore = beans.get('activitystore');
var SoCraTesActivity = beans.get('socratesActivity');
var Member = beans.get('member');

var membersService = beans.get('membersService');
var groupsService = beans.get('groupsService');
var groupstore = beans.get('groupstore');
var memberstore = beans.get('memberstore');
var fieldHelpers = beans.get('fieldHelpers');
var notifications = beans.get('socratesNotifications');

describe('Registration Service', function () {

  var socrates;
  var socratesActivity;
  var registrationTuple;
  var savedActivity;

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
    sinon.stub(notifications, 'changedDuration');
    sinon.stub(notifications, 'changedResource');
    sinon.stub(notifications, 'changedWaitinglist');
    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      callback(null, new Member({id: 'memberId'}));
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

    savedActivity = undefined;
    sinon.stub(activitystore, 'saveActivity', function (activity, callback) {
      savedActivity = activity;
      callback();
    });
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
      expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.eql([]);
      expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql([]);

      registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql(['SessionID:sessionId']);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.eql([]);
        done(err);
      });
    });

    it('adds the registrant to the waitinglist if the registration data says so and if a waitinglist is present', function (done) {
      registrationTuple.duration = 'waitinglist';
      socrates.resources.single._waitinglist = [];
      expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.eql([]);
      expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql([]);

      registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql([]);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()[0].state._memberId).to.eql('SessionID:sessionId');
        done(err);
      });
    });

    it('does not add the registrant to the waitinglist if the registration data says so but no waitinglist is present', function (done) {
      registrationTuple.duration = 'waitinglist';
      socrates.resources.single._waitinglist = undefined;
      expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.eql([]);
      expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql([]);

      registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
        expect(socratesActivity.resourceNamed('single').registeredMembers()).to.eql([]);
        expect(socratesActivity.resourceNamed('single').waitinglistEntries()).to.eql([]);
        done(err);
      });
    });

  });

});