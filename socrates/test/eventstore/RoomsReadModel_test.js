/*eslint no-underscore-dangle: 0*/
'use strict';

const moment = require('moment-timezone');
const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');
const events = beans.get('events');
const RoomsReadModel = beans.get('RoomsReadModel');
const RegistrationReadModel = beans.get('RegistrationReadModel');
const SoCraTesReadModel = beans.get('SoCraTesReadModel');
const Member = beans.get('member');

const bedInDouble = 'bed_in_double';

const aLongTimeAgo = moment.tz().subtract(40, 'minutes');

describe('The rooms read model', () => {

  let listOfEvents;

  beforeEach(() => {
    listOfEvents = [];

    listOfEvents = [
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId1', aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId2', aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId3', aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId4', aLongTimeAgo),
      events.registeredParticipantFromWaitinglist(bedInDouble, 2, 'memberId5', aLongTimeAgo)
    ];
  });

  it('lists those participants that already are in a room', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);
    const readModel = new RoomsReadModel(listOfEvents, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents)));

    const participantsInRoom = readModel.participantsInRoom(bedInDouble);

    expect(participantsInRoom).to.eql(['memberId1', 'memberId2']);
  });


  it('lists those participants that are not yet in a room', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);
    const readModel = new RoomsReadModel(listOfEvents, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents)));

    const participantsWithoutRoom = readModel.participantsWithoutRoomIn(bedInDouble);

    expect(participantsWithoutRoom).to.eql(['memberId3', 'memberId4', 'memberId5']);
  });

  it('returns the id of a member\'s roommate', () => {
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2')
    ]);
    const readModel = new RoomsReadModel(listOfEvents, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents)));

    expect(readModel.roommateFor(bedInDouble, 'memberId1')).to.be('memberId2');
    expect(readModel.roommateFor(bedInDouble, 'memberId2')).to.be('memberId1');
  });

  it('returns undefined if the member is not associated to a roommate', () => {
    const readModel = new RoomsReadModel(listOfEvents, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents)));
    expect(readModel.roommateFor(bedInDouble, 'memberId1')).to.be(undefined);
  });

  it('lists the room pairs', () => {
    const allKnownMembers = [
      new Member({id: 'memberId1'}),
      new Member({id: 'memberId2'}),
      new Member({id: 'memberId3'}),
      new Member({id: 'memberId4'}),
      new Member({id: 'memberId5'})
    ];
    listOfEvents = listOfEvents.concat([
      events.roomPairWasAdded(bedInDouble, 'memberId1', 'memberId2'),
      events.roomPairWasAdded(bedInDouble, 'memberId3', 'memberId4')
    ]);
    const readModel = new RoomsReadModel(listOfEvents, new RegistrationReadModel(listOfEvents, new SoCraTesReadModel(listOfEvents)));

    const roomPairs = readModel.roomPairsWithFullMembersFrom(bedInDouble, allKnownMembers);

    expect(roomPairs).to.have.length(2);
    expect(roomPairs[0].participant1.id()).to.be('memberId1');
    expect(roomPairs[0].participant2.id()).to.be('memberId2');
    expect(roomPairs[1].participant1.id()).to.be('memberId3');
    expect(roomPairs[1].participant2.id()).to.be('memberId4');
  });

});
