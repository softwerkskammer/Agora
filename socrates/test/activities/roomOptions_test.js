'use strict';

const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');
const roomOptions = beans.get('roomOptions');

describe('Room Options', () => {
  describe('for a room', () => {
    it('information contains the correct room name for each room selection', () => {
      expect(roomOptions.informationFor('single', '2').room).to.be('single room');
      expect(roomOptions.informationFor('bed_in_double', '2').room).to.be('bed in a double room');
      expect(roomOptions.informationFor('bed_in_junior', '2').room).to.be('bed in a junior room');
      expect(roomOptions.informationFor('junior', '2').room).to.be('junior room (exclusively)');
    });

    it('information contains the correct number of nights for each duration selection', () => {
      expect(roomOptions.informationFor('single', '2').nights).to.be('2');
      expect(roomOptions.informationFor('single', '3').nights).to.be('3');
      expect(roomOptions.informationFor('single', '4').nights).to.be(3);
      expect(roomOptions.informationFor('single', '5').nights).to.be(4);
    });

    it('information contains the correct weekday for each duration selection', () => {
      expect(roomOptions.informationFor('single', '2').until).to.be('saturday evening');
      expect(roomOptions.informationFor('single', '3').until).to.be('sunday morning');
      expect(roomOptions.informationFor('single', '4').until).to.be('sunday evening');
      expect(roomOptions.informationFor('single', '5').until).to.be('monday morning');
    });

    it('returns the correct number of nights for each duration selection', () => {
      expect(roomOptions.durationFor('2').nights).to.be('2');
      expect(roomOptions.durationFor('3').nights).to.be('3');
      expect(roomOptions.durationFor('4').nights).to.be(3);
      expect(roomOptions.durationFor('5').nights).to.be(4);
    });

    it('returns the correct weekday for each duration selection', () => {
      expect(roomOptions.durationFor('2').until).to.be('saturday evening');
      expect(roomOptions.durationFor('3').until).to.be('sunday morning');
      expect(roomOptions.durationFor('4').until).to.be('sunday evening');
      expect(roomOptions.durationFor('5').until).to.be('monday morning');
    });

    it('returns whether the duration is valid', () => {
      expect(roomOptions.isValidDuration(0)).to.be(false);
      expect(roomOptions.isValidDuration(1)).to.be(false);

      expect(roomOptions.isValidDuration(2)).to.be(true);
      expect(roomOptions.isValidDuration(3)).to.be(true);
      expect(roomOptions.isValidDuration(4)).to.be(true);
      expect(roomOptions.isValidDuration(5)).to.be(true);

      expect(roomOptions.isValidDuration(6)).to.be(false);
    });

    it('returns whether the room type is valid', () => {
      expect(roomOptions.isValidRoomType('single')).to.be(true);
      expect(roomOptions.isValidRoomType('bed_in_double')).to.be(true);
      expect(roomOptions.isValidRoomType('junior')).to.be(true);
      expect(roomOptions.isValidRoomType('bed_in_junior')).to.be(true);

      expect(roomOptions.isValidRoomType('0')).to.be(false);
      expect(roomOptions.isValidRoomType('')).to.be(false);
      expect(roomOptions.isValidRoomType('bed_in')).to.be(false);
    });

  });

  describe('for a room\'s waitinglist', () => {
    it('returns the correct room name for each room selection', () => {
      expect(roomOptions.waitinglistInformationFor('single').room).to.be('single room');
      expect(roomOptions.waitinglistInformationFor('bed_in_double').room).to.be('bed in a double room');
      expect(roomOptions.waitinglistInformationFor('bed_in_junior').room).to.be('bed in a junior room');
      expect(roomOptions.waitinglistInformationFor('junior').room).to.be('junior room (exclusively)');
    });
  });

});
