'use strict';

const beans = require('simple-configure').get('beans');

const misc = beans.get('misc');
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
      return eventstoreService.saveCommandProcessor(registrationCommandProcessor, misc.compact([waitinglistReservationEvent]), err1 => {
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
    // TODO verify body fields
    const registrationTuple = {
      sessionId: sessionId,
      activityUrl: body.activityUrl,
      desiredRoomTypes: body.desiredRoomTypes.split(',')
    };

    subscriberstore.getSubscriber(memberID, (err2, subscriber) => {
      if (err2) { return callback(err2); }
      subscriber.fillFromUI(body);
      subscriberstore.saveSubscriber(subscriber, () => {

        eventstoreService.getRegistrationCommandProcessor(registrationTuple.activityUrl, (err, commandProcessor) => {
          if (err || !commandProcessor) { return callback(err); }

          const waitinglistRegistrationEvent = commandProcessor.registerWaitinglistParticipant(registrationTuple.desiredRoomTypes, registrationTuple.sessionId, memberID);
          return eventstoreService.saveCommandProcessor(commandProcessor, misc.compact([waitinglistRegistrationEvent]), err1 => {
            if (err1) { return callback(err1); }

            const waitinglistRegistrationEventMsg = waitinglistRegistrationEvent && waitinglistRegistrationEvent.event;
            // error and success handling as indicated by the event:
            if (waitinglistRegistrationEventMsg === eventConstants.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
              socratesNotifications.newWaitinglistEntry(memberID, registrationTuple.desiredRoomTypes.map(roomType => roomOptions.waitinglistInformationFor(roomType)));
              return callback(null);
            }

            if (waitinglistRegistrationEventMsg === eventConstants.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_A_SECOND_TIME) {
              return callback(null, 'activities.registration_problem', 'activities.already_registered');
            }
            if (waitinglistRegistrationEventMsg === eventConstants.DID_NOT_REGISTER_WAITINGLIST_PARTICIPANT_WITH_EXPIRED_OR_MISSING_RESERVATION) {
              return callback(null, 'activities.registration_problem', 'activities.registration_timed_out');
            }
            callback(null, 'activities.registration_problem', 'activities.registration_not_possible');
          });
        });
      });
    });
  }

};
