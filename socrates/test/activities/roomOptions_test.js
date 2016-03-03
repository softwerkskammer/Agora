'use strict';

var expect = require('must-dist');

var roomOptions = require('../../testutil/configureForTest').get('beans').get('roomOptions');

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

    it('returns whether the registration and waitinglist checkboxes must be displayed', function () {
      function activity(alreadyRegistered, isFull) {
        return {
          isAlreadyRegistered: function () { return alreadyRegistered; },
          resourceNamed: function () {
            return {
              canSubscribe: function () { return !isFull; }, // isRegistrationOpen (always true) && ! isFull
              hasWaitinglist: function () { return true; }  // has a _hasWaitinglist entry (always true)
            };
          }
        };
      }

      var registrationIsOpen = true;
      // if registered, it does not matter whether the resource is full - we always show the checkboxes to indicate the registered slot
      expect(roomOptions.all(activity(true, true), 'member-id', registrationIsOpen)[0].displayRegistrationCheckboxes).to.eql(true);
      expect(roomOptions.all(activity(true, false), 'member-id', registrationIsOpen)[0].displayRegistrationCheckboxes).to.eql(true);

      // if not registered, the resource can only be selected if it is not full
      expect(roomOptions.all(activity(false, true), 'member-id', registrationIsOpen)[0].displayRegistrationCheckboxes).to.eql(false);
      expect(roomOptions.all(activity(false, false), 'member-id', registrationIsOpen)[0].displayRegistrationCheckboxes).to.eql(true);

      // if the registration is not open, the checkboxes are always displayed, no matter the status of the resource
      var registrationIsNotOpen = false;
      expect(roomOptions.all(activity(true, true), 'member-id', registrationIsNotOpen)[0].displayRegistrationCheckboxes).to.eql(true);
      expect(roomOptions.all(activity(true, false), 'member-id', registrationIsNotOpen)[0].displayRegistrationCheckboxes).to.eql(true);
      expect(roomOptions.all(activity(false, true), 'member-id', registrationIsNotOpen)[0].displayRegistrationCheckboxes).to.eql(true);
      expect(roomOptions.all(activity(false, false), 'member-id', registrationIsNotOpen)[0].displayRegistrationCheckboxes).to.eql(true);
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
