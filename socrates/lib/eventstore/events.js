'use strict';
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');

function enrich(event) {
  event.timestamp = moment();
  return event;
}

module.exports = {
  // room quota:
  roomQuotaWasSet: function (roomType, quota) {

    return enrich({event: e.ROOM_QUOTA_WAS_SET, roomType: roomType, quota: quota});
  },

  // reservation:
  reservationWasIssued: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  didNotIssueReservationForAlreadyReservedSession: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: e.DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  didNotIssueReservationForFullResource: function (roomType, duration, sessionId, timestamp) {
    return enrich({event: e.DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  // registration:
  participantWasRegistered: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId});
  },

  didNotRegisterParticipantForFullResource: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: e.DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId});
  },

  didNotRegisterParticipantASecondTime: function (roomType, duration, sessionId, memberId, timestamp) {
    return enrich({event: e.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId});
  },

  // after registration:
  roomTypeWasChanged: function (memberId, roomType, duration) {
    return enrich({event: e.ROOM_TYPE_WAS_CHANGED, memberId: memberId, roomType: roomType, duration: duration});
  },

  didNotChangeRoomTypeForNonParticipant: function (memberId, roomType) {
    return enrich({event: e.DID_NOT_CHANGE_ROOM_TYPE_FOR_NON_PARTICIPANT, memberId: memberId, roomType: roomType});
  },

  durationWasChanged: function (memberId, roomType, duration) {
    return enrich({event: e.DURATION_WAS_CHANGED, memberId: memberId, roomType: roomType, duration: duration});
  },

  didNotChangeDurationForNonParticipant: function (memberId, duration) {
    return enrich({event: e.DID_NOT_CHANGE_DURATION_FOR_NON_PARTICIPANT, memberId: memberId, duration: duration});
  }
};
