/*eslint no-underscore-dangle: 0*/
'use strict';

var beans = require('simple-configure').get('beans');
var RegistrationReadModel = beans.get('RegistrationReadModel');


function RoomsWriteModel(eventStore) {
  this._eventStore = eventStore;
  this.registrationReadModel = new RegistrationReadModel(eventStore);
}

RoomsWriteModel.prototype.isParticipantIn = function (roomType, participantId) {
  return this.registrationReadModel.registeredInRoomType(participantId) === roomType;
};

/////////////////////////////////////////////////////////////////////////////////////////
RoomsWriteModel.prototype.updateRoomsEvents = function (newEvents) {
  this._eventStore.updateRoomsEvents(newEvents);
};

RoomsWriteModel.prototype.eventStore = function () {
  // persistence needs an id:
  this._eventStore.setId();
  return this._eventStore;
};

module.exports = RoomsWriteModel;
