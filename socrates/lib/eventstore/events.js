'use strict';
var moment = require('moment-timezone');

function enrich(event) {
  event.timestamp = moment();
  return event;
}

var ROOM_QUOTA_WAS_SET = 'ROOM-QUOTA-WAS-SET';
var RESERVATION_WAS_ISSUED = 'RESERVATION-WAS-ISSUED';
var DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION = 'DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION';
var DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE = 'DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE';
var PARTICIPANT_WAS_REGISTERED = 'PARTICIPANT-WAS-REGISTERED';
var DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE = 'DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE';
var DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME = 'DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME';
var ROOM_TYPE_WAS_CHANGED = 'ROOM-TYPE-WAS-CHANGED';
var DURATION_WAS_CHANGED = 'DURATION-WAS-CHANGED';
var DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT = 'DID-NOT-CHANGE-ROOM-TYPE-FOR-NON-PARTICIPANT';
var DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT = 'DID-NOT-CHANGE-DURATION-FOR-NON-PARTICIPANT';

module.exports = {
  // room quota:
  roomQuotaWasSet: function (roomType, quota) {

    return enrich({event: ROOM_QUOTA_WAS_SET, roomType: roomType, quota: quota});
  },

  // reservation:
  reservationWasIssued: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: RESERVATION_WAS_ISSUED, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  didNotIssueReservationForAlreadyReservedSession: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  didNotIssueReservationForFullResource: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  // registration:
  participantWasRegistered: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId});
  },

  didNotRegisterParticipantForFullResource: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId});
  },

  didNotRegisterParticipantASecondTime: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId});
  },

  // after registration:
  roomTypeWasChanged: function (memberId, roomType, duration) {
    return enrich({event: ROOM_TYPE_WAS_CHANGED, memberId: memberId, roomType: roomType, duration: duration});
  },

  didNotChangeRoomTypeForNonParticipant: function (memberId, roomType) {
    return enrich({event: DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, memberId: memberId, roomType: roomType});
  },

  durationWasChanged: function (memberId, roomType, duration) {
    return enrich({event: DURATION_WAS_CHANGED, memberId: memberId, roomType: roomType, duration: duration});
  },

  didNotChangeDurationForNonParticipant: function (memberId, duration) {
    return enrich({event: DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT, memberId: memberId, duration: duration});
  }
};
