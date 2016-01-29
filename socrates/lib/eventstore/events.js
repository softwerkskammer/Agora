'use strict';
var moment = require('moment-timezone');

function enrich(event) {
  event.timestamp = moment(); // TODO ?!?!
  return event;
}

var ROOM_QUOTA_WAS_SET = 'ROOM-QUOTA-WAS-SET';
var RESERVATION_WAS_ISSUED = 'RESERVATION-WAS-ISSUED';
var PARTICIPANT_WAS_REGISTERED = 'PARTICIPANT-WAS-REGISTERED';

module.exports = {
  roomQuotaWasSet: function (roomType, quota) {

    return enrich({event: ROOM_QUOTA_WAS_SET, roomType: roomType, quota: quota});
  },

  reservationWasIssued: function (roomType) {
    return enrich({event: RESERVATION_WAS_ISSUED, roomType: roomType});
  },

  participantWasRegistered: function (roomType) {
    return enrich({event: PARTICIPANT_WAS_REGISTERED, roomType: roomType});
  }
};
