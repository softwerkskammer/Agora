/* eslint no-underscore-dangle: 0 */
'use strict';

var moment = require('moment-timezone');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');

var socratesMembersService = beans.get('socratesMembersService');
var events = beans.get('events');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var activitystore = beans.get('activitystore');
var Member = beans.get('member');
var Subscriber = beans.get('subscriber');

var memberstore = beans.get('memberstore');
var notifications = beans.get('socratesNotifications');

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');

describe('SoCraTes Members Service', function () {

  var globalEventStore;

  beforeEach(function () {
    globalEventStore = new GlobalEventStore();

    sinon.stub(notifications, 'newParticipant');
    sinon.stub(notifications, 'changedDuration');
    sinon.stub(notifications, 'changedResource');
    sinon.stub(notifications, 'changedWaitinglist');
    sinon.stub(notifications, 'removedFromParticipants');
    sinon.stub(notifications, 'removedFromWaitinglist');

    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      if (nickname === 'nicknameForPair1') { return callback(null, new Member({id: 'memberIdForPair1'})); }
      if (nickname === 'nicknameForPair2') { return callback(null, new Member({id: 'memberIdForPair2'})); }
      callback(null, new Member({id: 'memberId'}));
    });

    sinon.stub(eventstore, 'getEventStore', function (url, callback) {
      callback(null, globalEventStore);
    });
    sinon.stub(eventstore, 'saveEventStore', function (store, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('checking participation of a subscriber', function () {
    it('tells that a subscriber participated in an old SoCraTes', function (done) {
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId', function (groups, memberId, upcoming, callback) {
        if (upcoming) { return callback(null, []); }
        callback(null, [{state: {isSoCraTes: true}}, {state: {isSoCraTes: false}}]);
      });

      socratesMembersService.participationStatus(new Subscriber({id: 'memberId'}), function (err, result) {
        expect(result).to.be.true();
        done(err);
      });
    });

    it('tells that a subscriber will participate or participated in a new eventsourced SoCraTes', function (done) {
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId', function (groups, memberId, upcoming, callback) {
        return callback(null, []);
      });
      globalEventStore.state.registrationEvents = [
        events.participantWasRegistered('single', 3, 'sessionId', 'memberId', aLongTimeAgo)
      ];

      socratesMembersService.participationStatus(new Subscriber({id: 'memberId'}), function (err, result) {
        expect(result).to.be.true();
        done(err);
      });
    });

    it('tells that a subscriber did not and will not participate in any SoCraTes', function (done) {
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId', function (groups, memberId, upcoming, callback) {
        callback(null, [{state: {isSoCraTes: false}}]);
      });

      socratesMembersService.participationStatus(new Subscriber({id: 'memberId'}), function (err, result) {
        expect(result).to.be.false();
        done(err);
      });
    });
  });
});
