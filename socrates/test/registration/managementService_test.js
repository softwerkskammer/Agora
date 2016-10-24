'use strict';

var moment = require('moment-timezone');
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');

var managementService = beans.get('managementService');

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');

describe('Management Service', function () {

  describe('when calculating durations', function () {

    var eventStore;

    beforeEach(function () {
      eventStore = new GlobalEventStore();
    });

    it('counts each value', function () {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist('single', 2, 'member-id1', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('single', 2, 'member-id2', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('single', 4, 'member-id3', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('single', 3, 'member-id4', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('single', 5, 'member-id5', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('single', 2, 'member-id6', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('single', 3, 'member-id7', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 2, 'member-id8', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 2, 'member-id9', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 4, 'member-id10', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 3, 'member-id11', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 5, 'member-id12', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 2, 'member-id13', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 3, 'member-id14', aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      var durations = managementService.durations(readModel);

      expect(durations).to.have.ownKeys(['2', '3', '4', '5']);
      expect(durations[2]).to.eql({count: 6, duration: 'saturday evening', total: 14});
      expect(durations[3]).to.eql({count: 4, duration: 'sunday morning', total: 8});
      expect(durations[4]).to.eql({count: 2, duration: 'sunday evening', total: 4});
      expect(durations[5]).to.eql({count: 2, duration: 'monday morning', total: 2});
    });

    it('counts only durations that are present', function () {
      eventStore.state.events = [
        events.registeredParticipantFromWaitinglist('single', 2, 'member-id1', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('single', 2, 'member-id2', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('single', 5, 'member-id3', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 2, 'member-id4', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 2, 'member-id5', aLongTimeAgo),
        events.registeredParticipantFromWaitinglist('junior', 4, 'member-id6', aLongTimeAgo)
      ];
      const readModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));

      var durations = managementService.durations(readModel);

      expect(durations).to.have.ownKeys(['2', '4', '5']);
      expect(durations[2]).to.eql({count: 4, duration: 'saturday evening', total: 6});
      expect(durations[4]).to.eql({count: 1, duration: 'sunday evening', total: 2});
      expect(durations[5]).to.eql({count: 1, duration: 'monday morning', total: 1});
    });

  });

});
