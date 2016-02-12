'use strict';
var moment = require('moment-timezone');

function enrich(event, timestamp) {
  event.timestamp = timestamp || moment();
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
var DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT = 'DID-NOT-CHANGE-ROOM-TYPE-FOR-NON-PARTICIPANT';

module.exports = {
  // room quota:
  roomQuotaWasSet: function (roomType, quota) {

    return enrich({event: ROOM_QUOTA_WAS_SET, roomType: roomType, quota: quota});
  },

  // reservation:
  reservationWasIssued: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: RESERVATION_WAS_ISSUED, sessionID: sessionId, roomType: roomType, duration: duration}, timestamp);
  },

  didNotIssueReservationForAlreadyReservedSession: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId, roomType: roomType, duration: duration}, timestamp);
  },

  didNotIssueReservationForFullResource: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE, sessionID: sessionId, roomType: roomType, duration: duration}, timestamp);
  },

  // registration:
  participantWasRegistered: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: PARTICIPANT_WAS_REGISTERED, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId}, timestamp);
  },

  didNotRegisterParticipantForFullResource: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId}, timestamp);
  },

  didNotRegisterParticipantASecondTime: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId}, timestamp);
  },

  // after registration:
  roomTypeWasChanged: function (memberId, roomType) {
    return enrich({event: ROOM_TYPE_WAS_CHANGED, memberId: memberId, roomType: roomType});
  },

  didNotChangeRoomTypeForNonParticipant: function (memberId, roomType) {
    return enrich({event: DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, memberId: memberId, roomType: roomType});
  }
};
