/*eslint no-underscore-dangle: 0*/
'use strict';

var expect = require('must-dist');
var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('../../testutil/configureForTest').get('beans');
var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var RoomsWriteModel = beans.get('RoomsWriteModel');
var RoomsReadModel = beans.get('RoomsReadModel');
var RegistrationReadModel = beans.get('RegistrationReadModel');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');
var RoomsCommandProcessor = beans.get('RoomsCommandProcessor');
var e = beans.get('eventConstants');

var aLongTimeAgo = moment.tz().subtract(40, 'minutes');

function stripTimestamps(someEvents) {
  return R.map(function (event) {
    var newEvent = R.clone(event);
    delete newEvent.timestamp;
    return newEvent;
  }, someEvents);
}

var bedInDouble = 'bed_in_double';

describe('The rooms command processor', function () {

  var eventStore;

  beforeEach(function () {
    eventStore = new GlobalEventStore();

    eventStore.state.registrationEvents = [
      events.participantWasRegistered(bedInDouble, 2, 'sessionId1', 'memberId1', aLongTimeAgo),
      events.participantWasRegistered(bedInDouble, 2, 'sessionId2', 'memberId2', aLongTimeAgo),
      events.participantWasRegistered(bedInDouble, 2, 'sessionId3', 'memberId3', aLongTimeAgo),
      events.participantWasRegistered(bedInDouble, 2, 'sessionId4', 'memberId4', aLongTimeAgo),
      events.participantWasRegistered(bedInDouble, 2, 'sessionId5', 'memberId5', aLongTimeAgo)
    ];
  });

  it('can put two participants into a room', function () {
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', 'memberId2');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.ROOM_PAIR_WAS_ADDED, roomType: bedInDouble, participant1Id: 'memberId1', participant2Id: 'memberId2'}
    ]);
  });

  it('does not create a room if one of the participants is undefined', function () {
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', undefined);

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: undefined}
    ]);
  });

  it('does not create a room if one of the participants is null', function () {
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, null, 'memberId5');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: null}
    ]);
  });

  it('does not create a room if both participants do not exist', function () {
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, undefined, null);

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: undefined},
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: null}
    ]);
  });

  it('does not create a room if the first participant is not known', function () {
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'unknownMemberId', 'memberId5');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: 'unknownMemberId'}
    ]);
  });

  it('does not create a room if the second participant is not known', function () {
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', 'unknownMemberId');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: 'unknownMemberId'}
    ]);
  });

  it('does not create a room if both participants are not known', function () {
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'unknownMemberId', 'anotherUnknownMemberId');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: 'unknownMemberId'},
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_NOT_IN_ROOM_TYPE, roomType: bedInDouble, memberId: 'anotherUnknownMemberId'}
    ]);
  });

  it('does not create a room if the two participants are identical', function () {
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', 'memberId1');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_PAIRED_WITH_THEMSELVES, roomType: bedInDouble, memberId: 'memberId1'}
    ]);
  });

  it('does not create a room if the first participant already is in a room', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];

    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId1', 'memberId3');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType: bedInDouble, memberId: 'memberId1'}
    ]);
  });

  it('does not create a room if the second participant already is in a room', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];

    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId4', 'memberId2');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType: bedInDouble, memberId: 'memberId2'}
    ]);
  });

  it('does not create a room if the participants already are in a room but in reverse order', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];

    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.addParticipantPairFor(bedInDouble, 'memberId2', 'memberId1');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType: bedInDouble, memberId: 'memberId2'},
      { event: e.DID_NOT_ADD_ROOM_PAIR_BECAUSE_PARTICIPANT_IS_ALREADY_IN_ROOM, roomType: bedInDouble, memberId: 'memberId1'}
    ]);
  });

  it('removes a pair if the members are given in the right order', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];

    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));

    const evts = commandProcessor.removeParticipantPairFor(bedInDouble, 'memberId1', 'memberId2');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.ROOM_PAIR_WAS_REMOVED, roomType: bedInDouble, participant1Id: 'memberId1', participant2Id: 'memberId2'}
    ]);
  });

  it('does not remove a pair if the members are given in the wrong order', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];

    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairFor(bedInDouble, 'memberId2', 'memberId1');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.DID_NOT_REMOVE_ROOM_PAIR_BECAUSE_THE_PAIR_DOES_NOT_EXIST_FOR_THIS_ROOM_TYPE, roomType: bedInDouble, participant1Id: 'memberId2', participant2Id: 'memberId1'}
    ]);
  });

  it('removes a pair if the first member is given', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];

    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining(bedInDouble, 'memberId1');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED, roomType: bedInDouble, memberIdToBeRemoved: 'memberId1', participant1Id: 'memberId1', participant2Id: 'memberId2'}
    ]);
  });

  it('removes a pair if the second member is given', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining(bedInDouble, 'memberId2');

    expect(stripTimestamps(evts)).to.eql([
      { event: e.ROOM_PAIR_CONTAINING_A_PARTICIPANT_WAS_REMOVED, roomType: bedInDouble, memberIdToBeRemoved: 'memberId2', participant1Id: 'memberId1', participant2Id: 'memberId2'}
    ]);
  });

  it('does not remove a pair if the participant is not in any pairs', function () {
    eventStore.state.roomsEvents = [
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ];
    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining(bedInDouble, 'memberId3');

    expect(stripTimestamps(evts)).to.eql([]);
  });

  it('does not do anything if asked for a single room', function () {
    eventStore.state.roomsEvents = [];

    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining('single', 'memberId');

    expect(stripTimestamps(evts)).to.eql([]);
  });

  it('does not do anything if asked for a junior room', function () {
    eventStore.state.roomsEvents = [];

    const registrationReadModel = new RegistrationReadModel(eventStore, new SoCraTesReadModel(eventStore));
    const commandProcessor = new RoomsCommandProcessor(new RoomsWriteModel(eventStore, new RoomsReadModel(eventStore, registrationReadModel), registrationReadModel));
    const evts = commandProcessor.removeParticipantPairContaining('junior', 'memberId');

    expect(stripTimestamps(evts)).to.eql([]);
  });

});
