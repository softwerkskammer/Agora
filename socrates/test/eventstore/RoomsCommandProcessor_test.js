/*eslint no-underscore-dangle: 0*/
'use strict';

const expect = require('must-dist');
const R = require('ramda');
const moment = require('moment-timezone');

const beans = require('../../testutil/configureForTest').get('beans');
const events = beans.get('events');
const RoomsWriteModel = beans.get('RoomsWriteModel');
const RoomsReadModel = beans.get('RoomsReadModel');
const RegistrationReadModel = beans.get('RegistrationReadModel');
const SoCraTesReadModel = beans.get('SoCraTesReadModel');
const RoomsCommandProcessor = beans.get('RoomsCommandProcessor');
const GlobalEventStore = beans.get('GlobalEventStore');
const e = beans.get('eventConstants');

const aLongTimeAgo = moment.tz().subtract(40, 'minutes');

function stripTimestamps(someEvents) {
  return someEvents.map(event => {
    const newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  });
}

function eventStoreWith(listOfEvents) {
  return new GlobalEventStore({url: 'socrates-url', events: listOfEvents});
}

const bedInDouble = 'bed_in_double';

describe('The rooms command processor', () => {

  //let listOfEvents;
  let listOfEvents;

  beforeEach(() => {
    //listOfEvents = new GlobalEventStore();

    listOfEvents = [
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId1', aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId2', aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId3', aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId4', aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId5', aLongTimeAgo)
    ];
  });

  it('can put two participants into a room', () => {
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', 'memberId2');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.ROOM_PAIR_WAS_ADDED, roomType: bedInDouble, participant1Id: 'memberId1', participant2Id: 'memberId2'}
    ]);
  });

  it('does not create a room if one of the participants is undefined', () => {
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', undefined);

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: undefined}
    ]);
  });

  it('does not create a room if one of the participants is null', () => {
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, null, 'memberId5');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: null}
    ]);
  });

  it('does not create a room if both participants do not exist', () => {
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, undefined, null);

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: undefined},
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: null}
    ]);
  });

  it('does not create a room if the first participant is not known', () => {
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'unknownMemberId', 'memberId5');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: 'unknownMemberId'}
    ]);
  });

  it('does not create a room if the second participant is not known', () => {
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', 'unknownMemberId');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: 'unknownMemberId'}
    ]);
  });

  it('does not create a room if both participants are not known', () => {
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'unknownMemberId', 'anotherUnknownMemberId');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: 'unknownMemberId'},
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: 'anotherUnknownMemberId'}
    ]);
  });

  it('does not create a room if the two participants are identical', () => {
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', 'memberId1');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_PAIRED_WITH_THEMSELVES, roomType: bedInDouble, memberId: 'memberId1'}
    ]);
  });

  it('does not create a room if the first participant already is in a room', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);

    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', 'memberId3');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType: bedInDouble, memberId: 'memberId1'}
    ]);
  });

  it('does not create a room if the second participant already is in a room', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);

    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId4', 'memberId2');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType: bedInDouble, memberId: 'memberId2'}
    ]);
  });

  it('does not create a room if the participants already are in a room but in reverse order', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);

    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId2', 'memberId1');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType: bedInDouble, memberId: 'memberId2'},
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType: bedInDouble, memberId: 'memberId1'}
    ]);
  });

  it('removes a pair if the members are given in the right order', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);

    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.removeParticipantPairFor(bedInDouble, 'memberId1', 'memberId2');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.ROOM_PAIR_WAS_REMOVED, roomType: bedInDouble, participant1Id: 'memberId1', participant2Id: 'memberId2'}
    ]);
  });

  it('does not remove a pair if the members are given in the wrong order', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);

    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairFor(bedInDouble, 'memberId2', 'memberId1');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_REMOVE_ROOM_PAIR_BECAUSE_THE_PAIR_DOES_NOT_EXIST_FOR_THIS_ROOM_TYPE, roomType: bedInDouble, participant1Id: 'memberId2', participant2Id: 'memberId1'}
    ]);
  });

  it('removes a pair if the first member is given', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);

    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining(bedInDouble, 'memberId1');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED, roomType: bedInDouble, memberIdToBeRemoved: 'memberId1', participant1Id: 'memberId1', participant2Id: 'memberId2'}
    ]);
  });

  it('removes a pair if the second member is given', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining(bedInDouble, 'memberId2');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED, roomType: bedInDouble, memberIdToBeRemoved: 'memberId2', participant1Id: 'memberId1', participant2Id: 'memberId2'}
    ]);
  });

  it('does not remove a pair if the participant is not in any pairs', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);
    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining(bedInDouble, 'memberId3');

    expect(stripTimestamps(evts)).to.eql([]);
  });

  it('does not do anything if asked for a single room', () => {

    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining('single', 'memberId');

    expect(stripTimestamps(evts)).to.eql([]);
  });

  it('does not do anything if asked for a junior room', () => {

    const registrationReadModel = new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStoreWith(listOfEvents), new RoomsReadModel(listOfEvents, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining('junior', 'memberId');

    expect(stripTimestamps(evts)).to.eql([]);
  });

});
