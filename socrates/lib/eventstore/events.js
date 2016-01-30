'use strict';
var moment = require('moment-timezone');

function enrich(event) {
  event.timestamp = moment();
  return event;
}

var ROOM_QUOTA_WAS_SET = 'ROOM-QUOTA-WAS-SET';
var RESERVATION_WAS_ISSUED = 'RESERVATION-WAS-ISSUED';
var PARTICIPANT_WAS_REGISTERED = 'PARTICIPANT-WAS-REGISTERED';
var ROOM_TYPE_WAS_CHANGED = 'ROOM-TYPE-WAS-CHANGED';
var DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT = 'DID-NOT-CHANGE-ROOM-TYPE-FOR-NON-PARTICIPANT';

module.exports = {
  roomQuotaWasSet: function (roomType, quota) {

    return enrich({event: ROOM_QUOTA_WAS_SET, roomType: roomType, quota: quota});
  },

  reservationWasIssued: function (roomType, sessionId) {
    return enrich({event: RESERVATION_WAS_ISSUED, sessionID: sessionId, roomType: roomType});
  },

  participantWasRegistered: function (roomType, sessionId, memberId) {
    return enrich({event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId, roomType: roomType, memberId: memberId});
  },

  roomTypeWasChanged: function (memberId, roomType) {
    return enrich({event: ROOM_TYPE_WAS_CHANGED, memberId: memberId, roomType: roomType});
  },

  didNotChangeRoomTypeForNonParticipant: function (memberId, roomType) {
    return enrich({event: DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, memberId: memberId, roomType: roomType});
  }
};
