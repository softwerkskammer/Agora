'use strict';
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var e = beans.get('eventConstants');

function enrich(event) {
  event.timestamp = moment();
  return event;
}

module.exports = {
  // general SoCraTes data:
  roomQuotaWasSet: function (roomType, quota) {
    return enrich({event: e.ROOM_QUOTA_WAS_SET, roomType: roomType, quota: quota});
  },

  urlWasSet: function (url) {
    return enrich({event: e.URL_WAS_SET, url: url});
  },

  startUnixWasSet: function (startUnix) {
    return enrich({event: e.START_UNIX_WAS_SET, startUnix: startUnix});
  },

  endUnixWasSet: function (endUnix) {
    return enrich({event: e.END_UNIX_WAS_SET, endUnix: endUnix});
  },

  // reservation:
  reservationWasIssued: function (roomType, duration, sessionId) {
    return enrich({event: e.RESERVATION_WAS_ISSUED, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  waitinglistReservationWasIssued: function (roomType, sessionId) {
    return enrich({event: e.WAITINGLIST_RESERVATION_WAS_ISSUED, sessionID: sessionId, desiredRoomTypes: [roomType]});
  },

  didNotIssueReservationForAlreadyReservedSession: function (roomType, duration, sessionId) {
    return enrich({event: e.DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  didNotIssueWaitinglistReservationForAlreadyReservedSession: function (roomType, sessionId) {
    return enrich({event: e.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION, sessionID: sessionId, desiredRoomTypes: [roomType]});
  },

  didNotIssueReservationForFullResource: function (roomType, duration, sessionId) {
    return enrich({event: e.DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE, sessionID: sessionId, roomType: roomType, duration: duration});
  },

  // registration:
  participantWasRegistered: function (roomType, duration, sessionId, memberId) {
    return enrich({event: e.PARTICIPANT_WAS_REGISTERED, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId});
  },

  waitinglistParticipantWasRegistered: function (roomType, sessionId, memberId) {
    return enrich({event: e.WAITINGLIST_PARTICIPANT_WAS_REGISTERED, sessionID: sessionId, desiredRoomTypes: [roomType], memberId: memberId});
  },

  didNotRegisterParticipantForFullResource: function (roomType, duration, sessionId, memberId) {
    return enrich({event: e.DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE, sessionID: sessionId, roomType: roomType, duration: duration, memberId: memberId});
  },

  didNotRegisterParticipantASecondTime: function (roomType, duration, sessionId, memberId) {
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
