'use strict';

var _ = require('lodash');

var thursdayEvening = 7;
var dinner = 13;
var day = 37; // adapt this line to the actual day fare as reduced by sponsoring

var rooms = [
  {id: 'single', name: 'Single', display: 'single room', price: 70 + dinner},
  {id: 'bed_in_double', name: 'Double shared', display: 'bed in a double room', price: 50 + dinner},
  {id: 'bed_in_junior', name: 'Junior shared', display: 'bed in a junior room', price: 46 + dinner},
  {id: 'junior', name: 'Junior (exclusively)', display: 'junior room (exclusively)', price: 2 * 46 + dinner}
];

module.exports = {
  allIds: function () {
    return _.map(rooms, 'id');
  },

  allRoomOptions: function (registrationReadModel, memberId, isRegistrationOpen) {
    function option(room) {

      const registrationNotOpen = !isRegistrationOpen;
      const alreadyRegistered = registrationReadModel.isAlreadyRegisteredFor(memberId, room.id);
      const resourceNotFull = !registrationReadModel.isFull(room.id);
      const notOnWaitinglist = !registrationReadModel.isAlreadyOnWaitinglistFor(memberId, room.id);
      const displayRegistrationCheckboxes =
        registrationNotOpen || ((alreadyRegistered || resourceNotFull) && notOnWaitinglist);
      return {
        id: room.id,
        name: room.name,
        two: 2 * room.price + 2 * day + thursdayEvening,
        three: 3 * room.price + 2 * day + thursdayEvening,
        threePlus: 3 * room.price + 3 * day + thursdayEvening,
        four: 4 * room.price + 3 * day + thursdayEvening,
        displayRegistrationCheckboxes: displayRegistrationCheckboxes
      };
    }

    return _.map(rooms, option);
  },

  informationFor: function (id, duration) {
    return {
      room: this.waitinglistInformationFor(id).room,
      nights: (duration > 3 ? duration - 1 : duration),
      until: this.endOfStayFor(duration)
    };
  },

  endOfStayFor: function (duration) {
    var endOfStay = ['saturday evening', 'sunday morning', 'sunday evening', 'monday morning'];
    return endOfStay[duration - 2];
  },

  waitinglistInformationFor: function (id) {
    return {room: _.find(rooms, {id: id}).display};
  }
};
