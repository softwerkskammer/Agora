'use strict';

var beans = require('simple-configure').get('beans');

var subscriberstore = beans.get('subscriberstore');
var socratesNotifications = beans.get('socratesNotifications');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var roomOptions = beans.get('roomOptions');
var eventstoreService = beans.get('eventstoreService');
var eventConstants = beans.get('eventConstants');

var conflictingVersionsLogger = require('winston').loggers.get('socrates');

module.exports = {

  startRegistration: function (registrationTuple, memberIdIfKnown, now, callback) {
    var self = this;
    var reservationEvent;
    var waitinglistReservationEvent;
    eventstoreService.getRegistrationCommandProcessor(registrationTuple.activityUrl, function (err, registrationCommandProcessor) {
      if (err || !registrationCommandProcessor) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      if (registrationTuple.desiredRoomTypes.length > 0) {
        waitinglistReservationEvent = registrationCommandProcessor.issueWaitinglistReservation(registrationTuple.desiredRoomTypes, registrationTuple.sessionId, memberIdIfKnown, now);
      }
      if (registrationTuple.roomType && registrationTuple.duration) {
        reservationEvent = registrationCommandProcessor.issueReservation(registrationTuple.roomType, registrationTuple.duration, registrationTuple.sessionId, memberIdIfKnown, now);
      }
      return eventstoreService.saveCommandProcessor(registrationCommandProcessor, function (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          var message = JSON.stringify({
            message: CONFLICTING_VERSIONS,
            function: 'startRegistration',
            tuple: registrationTuple,
            event: reservationEvent,
            waitingListEvent: waitinglistReservationEvent
          });
          conflictingVersionsLogger.warn(message);
          // we try again because of a racing condition during save:
          return self.startRegistration(registrationTuple, memberIdIfKnown, now, callback);
        }
        if (err1) {
          return callback(err1);
        }
        if (reservationEvent === eventConstants.DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE) {
          return callback(null, 'activities.registration_problem', 'activities.registration_is_full');
        }
        if (reservationEvent === eventConstants.RESERVATION_WAS_ISSUED
          || reservationEvent === eventConstants.DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION
          || waitinglistReservationEvent === eventConstants.WAITINGLIST_RESERVATION_WAS_ISSUED
          || waitinglistReservationEvent === eventConstants.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION
        ) {
          return callback(null); // let the user continue normally even in case he already has a reservation
        }
        // for any surprises that we might encounter
        return callback(null, 'activities.registration_problem', 'activities.registration_not_possible');
      });
    });
  },

  completeRegistration: function (memberID, sessionId, body, callback) {
    var self = this;
    var registrationEvent;
    var waitinglistRegistrationEvent;
    var registrationTuple = {
      sessionId: sessionId,
      activityUrl: body.activityUrl,
      roomType: body.roomType,
      duration: body.duration && parseInt(body.duration, 10),
      desiredRoomTypes: body.desiredRoomTypes ? body.desiredRoomTypes.split(',') : [] // attention, empty string gets split as well...
    };

    subscriberstore.getSubscriber(memberID, function (err2, subscriber) {
      if (err2) { return callback(err2); }
      subscriber.fillFromUI(body);
      subscriberstore.saveSubscriber(subscriber, function () {

        eventstoreService.getRegistrationCommandProcessor(registrationTuple.activityUrl, function (err, commandProcessor) {
          if (err || !commandProcessor) { return callback(err); }

          if (registrationTuple.desiredRoomTypes.length > 0) {
            waitinglistRegistrationEvent = commandProcessor.registerWaitinglistParticipant(registrationTuple.desiredRoomTypes, registrationTuple.sessionId, memberID);
          }
          if (registrationTuple.roomType && registrationTuple.duration) {
            registrationEvent = commandProcessor.registerParticipant(registrationTuple.roomType, registrationTuple.duration, registrationTuple.sessionId, memberID);
          }
          return eventstoreService.saveCommandProcessor(commandProcessor, function (err1) {
            if (err1 && err1.message === CONFLICTING_VERSIONS) {
              var message = JSON.stringify({
                message: CONFLICTING_VERSIONS,
                function: 'completeRegistration',
                tuple: registrationTuple,
                event: registrationEvent,
                waitingListEvent: waitinglistRegistrationEvent,
                subscriber: subscriber
              });
              conflictingVersionsLogger.warn(message);
              // we try again because of a racing condition during save:
              return self.completeRegistration(memberID, sessionId, body, callback);
            }
            if (err1) { return callback(err1); }

            // error and success handling as indicated by the event:
            if (registrationEvent === eventConstants.PARTICIPANT_WAS_REGISTERED || waitinglistRegistrationEvent === eventConstants.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
              if (waitinglistRegistrationEvent === eventConstants.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
                socratesNotifications.newWaitinglistEntry(memberID, registrationTuple.desiredRoomTypes.map(roomType => roomOptions.waitinglistInformationFor(roomType)));
              }
              if (registrationEvent === eventConstants.PARTICIPANT_WAS_REGISTERED) {
                socratesNotifications.newParticipant(memberID, roomOptions.informationFor(registrationTuple.roomType, registrationTuple.duration));
              }
              return callback(null);
            }

            if (registrationEvent === eventConstants.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME
              || waitinglistRegistrationEvent === eventConstants.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME) {
              return callback(null, 'activities.registration_problem', 'activities.already_registered');
            }
            if (registrationEvent === eventConstants.DID_NOT_REGISTER_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION
              || waitinglistRegistrationEvent === eventConstants.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION) {
              return callback(null, 'activities.registration_problem', 'activities.registration_timed_out');
            }
            callback(null, 'activities.registration_problem', 'activities.registration_not_possible');
          });
        });
      });
    });
  }

};
