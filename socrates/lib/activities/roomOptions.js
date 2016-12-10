'use strict';

const thursdayEvening = 7;
const dinner = 13;
const day = 37; // adapt this line to the actual day fare as reduced by sponsoring

const rooms = [
  {id: 'single', name: 'Single', display: 'single room', price: 70 + dinner},
  {id: 'bed_in_double', name: 'Double shared', display: 'bed in a double room', price: 50 + dinner},
  {id: 'bed_in_junior', name: 'Junior shared', display: 'bed in a junior room', price: 46 + dinner},
  {id: 'junior', name: 'Junior (exclusively)', display: 'junior room (exclusively)', price: 2 * 46 + dinner}
];

module.exports = {
  allIds: function allIds() {
    return rooms.map(room => room.id);
  },

  allRoomOptions: function allRoomOptions() {
    function option(room) {
      return {
        id: room.id,
        name: room.name,
        two: 2 * room.price + 2 * day + thursdayEvening,
        three: 3 * room.price + 2 * day + thursdayEvening,
        threePlus: 3 * room.price + 3 * day + thursdayEvening,
        four: 4 * room.price + 3 * day + thursdayEvening
      };
    }

    return rooms.map(option);
  },

  informationFor: function informationFor(id, duration) {
    return {
      room: this.waitinglistInformationFor(id).room,
      nights: (duration > 3 ? duration - 1 : duration),
      until: this.endOfStayFor(duration)
    };
  },

  endOfStayFor: function endOfStayFor(duration) {
    const endOfStay = ['saturday evening', 'sunday morning', 'sunday evening', 'monday morning'];
    return endOfStay[duration - 2];
  },

  isValidDuration: function isValidDuration(duration) {
    return !!this.endOfStayFor(duration);
  },

  isValidRoomType: function isValidRoomType(roomType) {
    return rooms.some(room => room.id === roomType);
  },

  waitinglistInformationFor: function waitinglistInformationFor(id) {
    return {room: rooms.find(room => room.id === id).display};
  }
};
