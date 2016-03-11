'use strict';

var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var roomOptions = beans.get('roomOptions');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RegistrationReadModel = beans.get('RegistrationReadModel');

describe('Room Options', function () {
  describe('for a room', function () {
    it('returns the correct room name for each room selection', function () {
      expect(roomOptions.informationFor('single', '2').room).to.be('single room');
      expect(roomOptions.informationFor('bed_in_double', '2').room).to.be('bed in a double room');
      expect(roomOptions.informationFor('bed_in_junior', '2').room).to.be('bed in a junior room');
      expect(roomOptions.informationFor('junior', '2').room).to.be('junior room (exclusively)');
    });

    it('returns the correct number of nights for each duration selection', function () {
      expect(roomOptions.informationFor('single', '2').nights).to.be('2');
      expect(roomOptions.informationFor('single', '3').nights).to.be('3');
      expect(roomOptions.informationFor('single', '4').nights).to.be(3);
      expect(roomOptions.informationFor('single', '5').nights).to.be(4);
    });

    it('returns the correct weekday for each duration selection', function () {
      expect(roomOptions.informationFor('single', '2').until).to.be('saturday evening');
      expect(roomOptions.informationFor('single', '3').until).to.be('sunday morning');
      expect(roomOptions.informationFor('single', '4').until).to.be('sunday evening');
      expect(roomOptions.informationFor('single', '5').until).to.be('monday morning');
    });

    it('returns whether the registration and waitinglist checkboxes must be displayed (based on ES)', function () {
      var sessionId1 = 'session-id-1';
      var sessionId2 = 'session-id-2';
      var untilSaturday = 'untilSaturday';
      var memberId1 = 'member-id-1';
      var memberId2 = 'member-id-2';
      var memberId3 = 'member-id-3';

      var roomIds = roomOptions.allIds();
      var eventStore = new GlobalEventStore();
      eventStore.state.socratesEvents = [
        events.roomQuotaWasSet(roomIds[0], 100),
        events.roomQuotaWasSet(roomIds[1], 1),
        events.roomQuotaWasSet(roomIds[2], 100),
        events.roomQuotaWasSet(roomIds[3], 0)];
      eventStore.state.registrationEvents = [
        events.participantWasRegistered(roomIds[0], untilSaturday, sessionId1, memberId1),
        events.participantWasRegistered(roomIds[1], untilSaturday, sessionId2, memberId2)];

      var readModel = new RegistrationReadModel(eventStore);

      // 0: registered, resource is not full
      // 1: registered, resource is full
      // 2: not registered, resource is not full
      // 3: not registered, resource is full

      var registrationIsOpen = true;
      // if registered, it does not matter whether the resource is full - we always show the checkboxes to indicate the registered slot
      expect(roomOptions.allRoomOptions(readModel, memberId2, registrationIsOpen)[1].displayRegistrationCheckboxes).to.eql(true);
      expect(roomOptions.allRoomOptions(readModel, memberId1, registrationIsOpen)[0].displayRegistrationCheckboxes).to.eql(true);

      // if not registered, the resource can only be selected if it is not full
      expect(roomOptions.allRoomOptions(readModel, memberId3, registrationIsOpen)[3].displayRegistrationCheckboxes).to.eql(false);
      expect(roomOptions.allRoomOptions(readModel, memberId3, registrationIsOpen)[2].displayRegistrationCheckboxes).to.eql(true);

      // if the registration is not open, the checkboxes are always displayed, no matter the status of the resource
      var registrationIsNotOpen = false;
      expect(roomOptions.allRoomOptions(readModel, memberId2, registrationIsNotOpen)[1].displayRegistrationCheckboxes).to.eql(true);
      expect(roomOptions.allRoomOptions(readModel, memberId1, registrationIsNotOpen)[0].displayRegistrationCheckboxes).to.eql(true);
      expect(roomOptions.allRoomOptions(readModel, memberId3, registrationIsNotOpen)[3].displayRegistrationCheckboxes).to.eql(true);
      expect(roomOptions.allRoomOptions(readModel, memberId3, registrationIsNotOpen)[2].displayRegistrationCheckboxes).to.eql(true);
    });

  });

  describe('for a room\'s waitinglist', function () {
    it('returns the correct room name for each room selection', function () {
      expect(roomOptions.waitinglistInformationFor('single').room).to.be('single room');
      expect(roomOptions.waitinglistInformationFor('bed_in_double').room).to.be('bed in a double room');
      expect(roomOptions.waitinglistInformationFor('bed_in_junior').room).to.be('bed in a junior room');
      expect(roomOptions.waitinglistInformationFor('junior').room).to.be('junior room (exclusively)');
    });
  });

});
