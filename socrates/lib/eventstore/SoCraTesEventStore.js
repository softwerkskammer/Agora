/*eslint no-underscore-dangle: 0*/
'use strict';

var R = require('ramda');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var events = beans.get('events');
var e = beans.get('eventConstants');
var socratesConstants = beans.get('socratesConstants');

var SoCraTesReadModel = beans.get('SoCraTesReadModel');
var GlobalEventStore = beans.get('GlobalEventStore');

function SoCraTesEventStore(object) {
  // TODO when loading from DB, sort event streams by timestamp!
  // event streams (will be persisted):
  this.state = object || {
      url: socratesConstants.currentUrl,
      socratesEvents: [],
      resourceEvents: []
    };

  // write model state (will not be persisted):
  this._quota = {};
  this._reservationsBySessionId = undefined;
  this._waitinglistReservationsBySessionId = undefined;
  this._participantsByMemberId = undefined;
  this._waitinglistParticipantsByMemberId = undefined;
  return this;
}

SoCraTesEventStore.prototype.id = function () {
  return this.state.id;
};


////////////////////////////////////////////////////////////////////////////////////////////
// Reservations and Participants:
////////////////////////////////////////////////////////////////////////////////////////////

// handle commands:
// that create Resource events:

////////////////////////////////////////////////////////////////////////////////////////////
// Waitinglist Reservations and Participants
////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////////////////
// General
////////////////////////////////////////////////////////////////////////////////////////////

SoCraTesEventStore.prototype._updateResourceEventsAndWriteModel = function (event) {
  // append to event stream:
  this.state.resourceEvents.push(event);
};

SoCraTesEventStore.prototype.isFull = function (roomType) {
  return new SoCraTesReadModel(new GlobalEventStore(this.state)).quotaFor(roomType) <= this.reservationsAndParticipantsFor(roomType).length;
};

SoCraTesEventStore.prototype.selectedOptionFor = function (memberID) {
  var participantEvent = this._participantEventFor(memberID);
  if (participantEvent) {
    return participantEvent.roomType + ',' + participantEvent.duration;
  }

  var waitinglistParticipantEvent = this._waitinglistParticipantEventFor(memberID);
  if (waitinglistParticipantEvent) {
    return waitinglistParticipantEvent.desiredRoomTypes[0] + ',waitinglist'; // TODO improve UX! Show all selected waitinglist options.
  }
  return null;
};

SoCraTesEventStore.prototype.roomTypesOf = function (memberID) {
  var participantEvent = this._participantEventFor(memberID);
  if (participantEvent) {
    return [participantEvent.roomType];
  }

  var waitinglistParticipantEvent = this._waitinglistParticipantEventFor(memberID);
  if (waitinglistParticipantEvent) {
    return waitinglistParticipantEvent.desiredRoomTypes;
  }
  return [];
};

module.exports = SoCraTesEventStore;
