'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');

var managementService = beans.get('managementService');

describe('Management Service', function () {

  describe('when calculating durations', function () {

    var eventStore;
    var readModel;

    beforeEach(function () {
      eventStore = new GlobalEventStore();
      readModel = new RegistrationReadModel(eventStore);
    });

    it('counts each value', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered('single', 2, 'session-id', 'member-id1'),
        events.participantWasRegistered('single', 2, 'session-id', 'member-id2'),
        events.participantWasRegistered('single', 4, 'session-id', 'member-id3'),
        events.participantWasRegistered('single', 3, 'session-id', 'member-id4'),
        events.participantWasRegistered('single', 5, 'session-id', 'member-id5'),
        events.participantWasRegistered('single', 2, 'session-id', 'member-id6'),
        events.participantWasRegistered('single', 3, 'session-id', 'member-id7'),
        events.participantWasRegistered('junior', 2, 'session-id', 'member-id8'),
        events.participantWasRegistered('junior', 2, 'session-id', 'member-id9'),
        events.participantWasRegistered('junior', 4, 'session-id', 'member-id10'),
        events.participantWasRegistered('junior', 3, 'session-id', 'member-id11'),
        events.participantWasRegistered('junior', 5, 'session-id', 'member-id12'),
        events.participantWasRegistered('junior', 2, 'session-id', 'member-id13'),
        events.participantWasRegistered('junior', 3, 'session-id', 'member-id14')
      ];

      var durations = managementService.durations(readModel);

      expect(durations).to.have.ownKeys(['2', '3', '4', '5']);
      expect(durations[2]).to.eql({count: 6, duration: 'saturday evening', total: 14});
      expect(durations[3]).to.eql({count: 4, duration: 'sunday morning', total: 8});
      expect(durations[4]).to.eql({count: 2, duration: 'sunday evening', total: 4});
      expect(durations[5]).to.eql({count: 2, duration: 'monday morning', total: 2});
    });

    it('counts only durations that are present', function () {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered('single', 2, 'session-id', 'member-id1'),
        events.participantWasRegistered('single', 2, 'session-id', 'member-id2'),
        events.participantWasRegistered('single', 5, 'session-id', 'member-id3'),
        events.participantWasRegistered('junior', 2, 'session-id', 'member-id4'),
        events.participantWasRegistered('junior', 2, 'session-id', 'member-id5'),
        events.participantWasRegistered('junior', 4, 'session-id', 'member-id6')
      ];

      var durations = managementService.durations(readModel);

      expect(durations).to.have.ownKeys(['2', '4', '5']);
      expect(durations[2]).to.eql({count: 4, duration: 'saturday evening', total: 6});
      expect(durations[4]).to.eql({count: 1, duration: 'sunday evening', total: 2});
      expect(durations[5]).to.eql({count: 1, duration: 'monday morning', total: 1});
    });

  });

});
