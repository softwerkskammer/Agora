'use strict';

var _ = require('lodash');

var dinner = 13;
var day = 17;

var rooms = [
  {id: 'single', name: 'Single', display: 'single room', price: 70 + dinner},
  {id: 'bed_in_double', name: 'Double shared', display: 'bed in a double room', price: 50 + dinner},
  {id: 'bed_in_junior', name: 'Junior shared', display: 'bed in a junior room', price: 46 + dinner},
  {id: 'junior', name: 'Junior (exclusive)', display: 'junior room (exclusively)', price: 2 * 46 + dinner}
];

function roomOptions(activity, memberId, isRegistrationOpen) {
  function option(room) {
    return {
      id: room.id,
      name: room.name,
      two: 2 * room.price + 2 * day,
      three: 3 * room.price + 2 * day,
      threePlus: 3 * room.price + 3 * day,
      four: 4 * room.price + 3 * day,
      displayRegistrationCheckboxes: (activity.isAlreadyRegistered(memberId) || !isRegistrationOpen || activity.resourceNamed(room.id).canSubscribe())
    };
  }

  return _.map(rooms, option);
}

function allIds() {
  return _.pluck(rooms, 'id');
}

function informationFor(id, duration) {
  var endOfStay = ['saturday evening', 'sunday morning', 'sunday evening', 'monday morning'];
  return {
    room: _.find(rooms, {id: id}).display,
    nights: (duration > 3 ? duration - 1 : duration),
    until: endOfStay[duration - 2]
  };
}

module.exports = {
  all: roomOptions,
  allIds: allIds(),
  informationFor: informationFor
};
