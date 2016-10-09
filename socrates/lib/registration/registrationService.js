'use strict';

const R = require('ramda');
const beans = require('simple-configure').get('beans');

const subscriberstore = beans.get('subscriberstore');
const socratesNotifications = beans.get('socratesNotifications');
const roomOptions = beans.get('roomOptions');
const eventstoreService = beans.get('eventstoreService');
const eventConstants = beans.get('eventConstants');


module.exports = {

  startRegistration: function startRegistration(registrationTuple, memberIdIfKnown, now, callback) {
    let waitinglistReservationEvent;
    eventstoreService.getRegistrationCommandProcessor(registrationTuple.activityUrl, (err, registrationCommandProcessor) => {
      if (err || !registrationCommandProcessor) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      if (registrationTuple.desiredRoomTypes.length > 0) {
        waitinglistReservationEvent = registrationCommandProcessor.issueWaitinglistReservation(registrationTuple.desiredRoomTypes, registrationTuple.duration, registrationTuple.sessionId, memberIdIfKnown, now);
      }

      const waitinglistReservationEventMsg = waitinglistReservationEvent && waitinglistReservationEvent.event;
      return eventstoreService.saveCommandProcessor(registrationCommandProcessor, R.filter(R.identity, [waitinglistReservationEvent]), err1 => {
        if (err1) { return callback(err1); }
        if (waitinglistReservationEventMsg === eventConstants.WAITINGLIST_RESERVATION_WAS_ISSUED
          || waitinglistReservationEventMsg === eventConstants.DID_NOT_ISSUE_WAITINGLIST_RESERVATION_FOR_ALREADY_RESERVED_SESSION
        ) {
          return callback(null); // let the user continue normally even in case he already has a reservation
        }
        // for any surprises that we might encounter
        return callback(null, 'activities.registration_problem', 'activities.registration_not_possible');
      });
    });
  },

  completeRegistration: function completeRegistration(memberID, sessionId, body, callback) {
    let registrationEvent;
    let waitinglistRegistrationEvent;
    const registrationTuple = {
      sessionId: sessionId,
      activityUrl: body.activityUrl,
      roomType: body.roomType,
      duration: body.duration && parseInt(body.duration, 10),
      desiredRoomTypes: body.desiredRoomTypes ? body.desiredRoomTypes.split(',') : [] // attention, empty string gets split as well...
    };

    subscriberstore.getSubscriber(memberID, (err2, subscriber) => {
      if (err2) { return callback(err2); }
      subscriber.fillFromUI(body);
      subscriberstore.saveSubscriber(subscriber, () => {

        eventstoreService.getRegistrationCommandProcessor(registrationTuple.activityUrl, (err, commandProcessor) => {
          if (err || !commandProcessor) { return callback(err); }

          if (registrationTuple.desiredRoomTypes.length > 0) {
            waitinglistRegistrationEvent = commandProcessor.registerWaitinglistParticipant(registrationTuple.desiredRoomTypes, registrationTuple.sessionId, memberID);
          }
          if (registrationTuple.roomType && registrationTuple.duration) {
            registrationEvent = commandProcessor.registerParticipant(registrationTuple.roomType, registrationTuple.duration, registrationTuple.sessionId, memberID);
          }
          const registrationEventMsg = registrationEvent && registrationEvent.event;
          const waitinglistRegistrationEventMsg = waitinglistRegistrationEvent && waitinglistRegistrationEvent.event;
          return eventstoreService.saveCommandProcessor(commandProcessor, R.filter(R.identity, [registrationEvent, waitinglistRegistrationEvent]), err1 => {
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
