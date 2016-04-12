/* eslint no-underscore-dangle: 0 */
'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var _ = require('lodash');
var moment = require('moment-timezone');

var beans = require('../../testutil/configureForTest').get('beans');

var activityParticipantService = beans.get('activityParticipantService');
var activitystore = beans.get('activitystore');
var SoCraTesActivity = beans.get('socratesActivity');
var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');

var events = beans.get('events');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');

describe('SoCraTes Wiki Service', function () {

  var eventStore;
  var subscriber;

  beforeEach(function () {
    eventStore = new GlobalEventStore();

    sinon.stub(eventstore, 'getEventStore', function (url, callback) {
      callback(null, eventStore);
    });

    sinon.stub(memberstore, 'getMembersForIds', function (ids, callback) {
      callback(null, _.map(ids, function (id) { return new Member({id: id}); }));
    });

    sinon.stub(subscriberstore, 'allSubscribers', function (callback) {
      callback(null, [subscriber]);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('loads the participants and their participation information for a year (before 2016)', function (done) {
    /*eslint camelcase: 0*/
    var socrates = {resources: {single: {_registeredMembers: [{memberId: 'memberId', duration: 2}]}}};
    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      callback(null, new SoCraTesActivity(socrates));
    });

    subscriber = new Subscriber({id: 'memberId'});
    subscriber.participationOf('2010').state.roommate = 'My buddy';

    activityParticipantService.getParticipantsFor('2010', function (err, participants) {
      expect(participants).to.have.length(1);
      expect(participants[0].participation.roommate()).to.be('My buddy');
      done(err);
    });
  });

  it('loads the participants and their participation information for a year (on or after 2016)', function (done) {
    eventStore.state.registrationEvents = [
      events.participantWasRegistered('single', 2, 'session-id', 'memberId', moment.tz())
    ];

    subscriber = new Subscriber({id: 'memberId'});
    subscriber.participationOf('2020').state.roommate = 'My buddy';

    activityParticipantService.getParticipantsFor('2020', function (err, participants) {
      expect(participants).to.have.length(1);
      expect(participants[0].participation.roommate()).to.be('My buddy');
      done(err);
    });
  });

});
