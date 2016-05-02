'use strict';

const R = require('ramda');
var beans = require('simple-configure').get('beans');

var subscriberstore = beans.get('subscriberstore');
var socratesNotifications = beans.get('socratesNotifications');
var roomOptions = beans.get('roomOptions');
var eventstoreService = beans.get('eventstoreService');
var eventConstants = beans.get('eventConstants');


module.exports = {

  startRegistration: function (registrationTuple, memberIdIfKnown, now, callback) {
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

      const reservationEventMsg = reservationEvent && reservationEvent.event;
      const waitinglistReservationEventMsg = waitinglistReservationEvent && waitinglistReservationEvent.event;
      return eventstoreService.saveCommandProcessor(registrationCommandProcessor, R.filter(R.identity, [reservationEvent, waitinglistReservationEvent]), function (err1) {
        if (err1) {
          return callback(err1);
        }
        if (reservationEventMsg === eventConstants.DID_NOT_ISSUE_RESERVATION_FOR_FULL_RESOURCE) {
          return callback(null, 'activities.registration_problem', 'activities.registration_is_full');
        }
        if (reservationEventMsg === eventConstants.RESERVATION_WAS_ISSUED
          || reservationEventMsg === eventConstants.DID_NOT_ISSUE_RESERVATION_FOR_ALREADY_RESERVED_SESSION
          || waitinglistReservationEventMsg === eventConstants.WAITINGLIST_RESERVATION_WAS_ISSUED
          || waitinglistReservationEventMsg === eventConstants.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION
        ) {
          return callback(null); // let the user continue normally even in case he already has a reservation
        }
        // for any surprises that we might encounter
        return callback(null, 'activities.registration_problem', 'activities.registration_not_possible');
      });
    });
  },

  completeRegistration: function (memberID, sessionId, body, callback) {
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
          const registrationEventMsg = registrationEvent && registrationEvent.event;
          const waitinglistRegistrationEventMsg = waitinglistRegistrationEvent && waitinglistRegistrationEvent.event;
          return eventstoreService.saveCommandProcessor(commandProcessor, R.filter(R.identity, [registrationEvent, waitinglistRegistrationEvent]), function (err1) {
            if (err1) { return callback(err1); }

            // error and success handling as indicated by the event:
            if (registrationEventMsg === eventConstants.PARTICIPANT_WAS_REGISTERED || waitinglistRegistrationEventMsg === eventConstants.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
              if (waitinglistRegistrationEventMsg === eventConstants.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
                socratesNotifications.newWaitinglistEntry(memberID, registrationTuple.desiredRoomTypes.map(roomType => roomOptions.waitinglistInformationFor(roomType)));
              }
              if (registrationEventMsg === eventConstants.PARTICIPANT_WAS_REGISTERED) {
                socratesNotifications.newParticipant(memberID, roomOptions.informationFor(registrationTuple.roomType, registrationTuple.duration));
              }
              return callback(null);
            }

            if (registrationEventMsg === eventConstants.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME
              || waitinglistRegistrationEventMsg === eventConstants.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME) {
              return callback(null, 'activities.registration_problem', 'activities.already_registered');
            }
            if (registrationEventMsg === eventConstants.DID_NOT_REGISTER_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION
              || waitinglistRegistrationEventMsg === eventConstants.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION) {
              return callback(null, 'activities.registration_problem', 'activities.registration_timed_out');
            }
            callback(null, 'activities.registration_problem', 'activities.registration_not_possible');
          });
        });
      });
    });
  }

};
