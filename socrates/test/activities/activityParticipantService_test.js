/* eslint no-underscore-dangle: 0 */
'use strict';

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');
const moment = require('moment-timezone');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const cache = conf.get('cache');

const activityParticipantService = beans.get('activityParticipantService');
const activitystore = beans.get('activitystore');
const SoCraTesActivity = beans.get('socratesActivity');
const Member = beans.get('member');
const Subscriber = beans.get('subscriber');

const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');

const events = beans.get('events');
const eventstore = beans.get('eventstore');
const GlobalEventStore = beans.get('GlobalEventStore');

describe('activityParticipantService', () => {

  let eventStore;
  let subscriber;

  beforeEach(() => {
    cache.flushAll();

    eventStore = new GlobalEventStore();

    sinon.stub(eventstore, 'getEventStore').callsFake((url, callback) => callback(null, eventStore));

    sinon.stub(memberstore, 'getMembersForIds').callsFake((ids, callback) => {
      callback(null, ids.map(id => new Member({id})));
    });

    sinon.stub(subscriberstore, 'allSubscribers').callsFake(callback => {
      callback(null, [subscriber]);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('loads the participants and their participation information for a year (before 2016)', done => {
    /*eslint camelcase: 0*/
    const socrates = {resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId', duration: 2}]}}};
    sinon.stub(activitystore, 'getActivity').callsFake((url, callback) => {
      callback(null, new SoCraTesActivity(socrates));
    });

    subscriber = new Subscriber({id: 'memberId'});
    subscriber.participationOf('2010').state.roommate = 'My buddy';

    activityParticipantService.getParticipantsFor('2010', (err, participants) => {
      expect(participants).to.have.length(1);
      expect(participants[0].participation.roommate()).to.be('My buddy');
      done(err);
    });
  });

  it('loads the participants and their participation information for a year (on or after 2016)', done => {
    eventStore.state.events = [
      events.registeredParticipantFromWaitinglist('single', 2, 'memberId', moment.tz())
    ];

    subscriber = new Subscriber({id: 'memberId'});
    subscriber.participationOf('2020').state.roommate = 'My buddy';

    activityParticipantService.getParticipantsFor('2020', (err, participants) => {
      expect(participants).to.have.length(1);
      expect(participants[0].participation.roommate()).to.be('My buddy');
      done(err);
    });
  });

  it('loads the waitinglist participants and their participation information for a year (on or after 2016)', done => {
    eventStore.state.events = [
      events.waitinglistParticipantWasRegistered(['single', 'junior'], 2, 'session-id', 'memberId', moment.tz())
    ];

    subscriber = new Subscriber({id: 'memberId'});
    //subscriber.participationOf('2020').state.roommate = 'My buddy';

    activityParticipantService.getWaitinglistParticipantsFor('2020', (err, participants) => {
      expect(participants).to.have.length(1);
      expect(participants[0].id()).to.be('memberId');
      done(err);
    });
  });

});
