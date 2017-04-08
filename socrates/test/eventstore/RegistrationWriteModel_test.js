'use strict';

const expect = require('must-dist');
const moment = require('moment-timezone');

const beans = require('../../testutil/configureForTest').get('beans');
const events = beans.get('events');
const RegistrationWriteModel = beans.get('RegistrationWriteModel');

const sessionId1 = 'session-id-1';
const sessionId2 = 'session-id-2';

const singleBedRoom = 'single';
const bedInDouble = 'bed_in_double';

const untilSaturday = 'untilSaturday';
const untilSundayMorning = 'untilSundayMorning';

const memberId1 = 'member-id-1';
const memberId2 = 'member-id-2';

const aLongTimeAgo = moment.tz().subtract(40, 'minutes');
const aShortTimeAgo = moment.tz().subtract(10, 'minutes');

describe('The registration write model', () => {

  describe('calculating the reservation expiration time (reservationExpiration)', () => {

    it('returns undefined as the expiration time if there are no waitinglist reservations for the given session id', () => {
      const listOfEvents = [
        events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aShortTimeAgo)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.reservationExpiration(sessionId2)).to.be(undefined);
    });

    it('returns undefined as the expiration time of the waitinglist reservation if it is already expired', () => {
      const listOfEvents = [
        events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.reservationExpiration(sessionId1)).to.be(undefined);
    });

    it('returns the expiration time of the waitinglist reservation if there is one', () => {
      const listOfEvents = [
        events.waitinglistReservationWasIssued(singleBedRoom, 2, sessionId1, memberId1, aShortTimeAgo)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.reservationExpiration(sessionId1).valueOf()).to.be(aShortTimeAgo.add(30, 'minutes').valueOf());
    });
  });

  describe('knows about registered persons (isAlreadyRegistered)', () => {
    it('registers a registrationTuple', () => {
      const listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aShortTimeAgo)];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.isAlreadyRegistered(memberId1)).to.be.true();
    });

  });

  describe('knows about participants on waitinglist (isAlreadyOnWaitinglist)', () => {
    it('returns false if participant is not on waitinglist', () => {
      const listOfEvents = [];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.isAlreadyOnWaitinglist(memberId1)).to.eql(false);
    });

    it('returns true if participant is on waitinglist', () => {
      const listOfEvents = [
        events.waitinglistParticipantWasRegistered(['single', 'junior'], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.isAlreadyOnWaitinglist(memberId1)).to.eql(true);
    });

  });

  describe('knows the room types of a participant or waitinglist participant (roomTypesOf)', () => {

    it('returns the correct room type for a registered participant', () => {
      const listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);
      expect(writeModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });

    it('returns the desired room types of a waitinglist participant', () => {
      const listOfEvents = [
        events.waitinglistParticipantWasRegistered([singleBedRoom, bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.roomTypesOf(memberId1)).to.eql([singleBedRoom, bedInDouble]);
    });

    it('returns the right room types if they were changed', () => {
      const listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSaturday, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], 2, sessionId2, memberId2, aLongTimeAgo),
        events.desiredRoomTypesWereChanged(memberId2, [singleBedRoom], 2, aLongTimeAgo),
        events.roomTypeWasChanged(memberId1, bedInDouble, untilSundayMorning, aLongTimeAgo)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.roomTypesOf(memberId1)).to.eql([bedInDouble]);
      expect(writeModel.roomTypesOf(memberId2)).to.eql([singleBedRoom]);
    });

    it('returns the right room types when participant/waitinglist participant was removed', () => {
      const listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([singleBedRoom], 2, sessionId2, memberId2, aLongTimeAgo),
        events.participantWasRemoved(singleBedRoom, memberId1),
        events.waitinglistParticipantWasRemoved([singleBedRoom], memberId2)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.roomTypesOf(memberId1)).to.eql([]);
      expect(writeModel.roomTypesOf(memberId2)).to.eql([]);
    });

    it('returns the registered room type even when participant is also on waitinglist', () => {
      const listOfEvents = [
        events.registeredParticipantFromWaitinglist(singleBedRoom, untilSundayMorning, memberId1, aLongTimeAgo),
        events.waitinglistParticipantWasRegistered([bedInDouble], 2, sessionId1, memberId1, aLongTimeAgo)
      ];
      const writeModel = new RegistrationWriteModel(listOfEvents);

      expect(writeModel.roomTypesOf(memberId1)).to.eql([singleBedRoom]);
    });
  });

});
