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
