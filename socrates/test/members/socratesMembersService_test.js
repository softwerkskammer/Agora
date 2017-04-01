/* eslint no-underscore-dangle: 0 */
'use strict';

const moment = require('moment-timezone');
const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const cache = conf.get('cache');

const socratesMembersService = beans.get('socratesMembersService');
const events = beans.get('events');
const eventstore = beans.get('eventstore');
const GlobalEventStore = beans.get('GlobalEventStore');
const activitystore = beans.get('activitystore');
const Member = beans.get('member');
const Subscriber = beans.get('subscriber');

const memberstore = beans.get('memberstore');
const notifications = beans.get('socratesNotifications');

const aLongTimeAgo = moment.tz().subtract(40, 'minutes');

describe('SoCraTes Members Service', () => {

  let globalEventStore;

  beforeEach(() => {
    globalEventStore = new GlobalEventStore();

    sinon.stub(notifications, 'newParticipant');
    sinon.stub(notifications, 'changedDuration');
    sinon.stub(notifications, 'changedResource');
    sinon.stub(notifications, 'changedWaitinglist');
    sinon.stub(notifications, 'removedFromParticipants');
    sinon.stub(notifications, 'removedFromWaitinglist');

    sinon.stub(memberstore, 'getMember').callsFake((nickname, callback) => {
      if (nickname === 'nicknameForPair1') { return callback(null, new Member({id: 'memberIdForPair1'})); }
      if (nickname === 'nicknameForPair2') { return callback(null, new Member({id: 'memberIdForPair2'})); }
      callback(null, new Member({id: 'memberId'}));
    });

    sinon.stub(eventstore, 'getEventStore').callsFake((url, callback) => callback(null, globalEventStore));
    sinon.stub(eventstore, 'saveEventStore').callsFake((store, callback) => callback());
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('checking participation of a subscriber', () => {
    it('tells that a subscriber participated in an old SoCraTes', done => {
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId').callsFake((groups, memberId, upcoming, callback) => {
        if (upcoming) { return callback(null, []); }
        callback(null, [{state: {isSoCraTes: true}}, {state: {isSoCraTes: false}}]);
      });

      socratesMembersService.participationStatus(new Subscriber({id: 'memberId'}), (err, result) => {
        expect(result).to.be.true();
        done(err);
      });
    });

    it('tells that a subscriber will participate or participated in a new eventsourced SoCraTes', done => {
      cache.flushAll();
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId').callsFake((groups, memberId, upcoming, callback) => callback(null, []));
      globalEventStore.state.events = [
        events.registeredParticipantFromWaitinglist('single', 3, 'memberId', aLongTimeAgo)
      ];

      socratesMembersService.participationStatus(new Subscriber({id: 'memberId'}), (err, result) => {
        expect(result).to.be.true();
        done(err);
      });
    });

    it('tells that a subscriber did not and will not participate in any SoCraTes', done => {
      cache.flushAll();
      sinon.stub(activitystore, 'activitiesForGroupIdsAndRegisteredMemberId').callsFake((groups, memberId, upcoming, callback) => {
        callback(null, [{state: {isSoCraTes: false}}]);
      });

      socratesMembersService.participationStatus(new Subscriber({id: 'memberId'}), (err, result) => {
        expect(result).to.be.false();
        done(err);
      });
    });
  });
});
