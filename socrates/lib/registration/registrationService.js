'use strict';

var beans = require('simple-configure').get('beans');

var subscriberstore = beans.get('subscriberstore');
var socratesNotifications = beans.get('socratesNotifications');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var roomOptions = beans.get('roomOptions');

var eventstoreService = beans.get('eventstoreService');
var eventConstants = beans.get('eventConstants');

module.exports = {

  startRegistration: function (registrationTuple, callback) {
    var self = this;
    var reservationEvent;
    eventstoreService.getRegistrationCommandProcessor(registrationTuple.activityUrl, function (err, registrationCommandProcessor) {
      if (err || !registrationCommandProcessor) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      if (registrationTuple.duration === 'waitinglist') {
        reservationEvent = registrationCommandProcessor.issueWaitinglistReservation(registrationTuple.desiredRoomTypes, registrationTuple.sessionID);
      } else {
        reservationEvent = registrationCommandProcessor.issueReservation(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID);
      }
      return eventstoreService.saveCommandProcessor(registrationCommandProcessor, function (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.startRegistration(registrationTuple, callback);
        }
        if (err1) { return callback(err1); }
        if (reservationEvent === eventConstants.RESERVATION_WAS_ISSUED || reservationEvent === eventConstants.WAITINGLIST_RESERVATION_WAS_ISSUED) {
          return callback(null);
        }
        return callback(null, 'activities.registration_not_now', 'activities.registration_not_possible');
      });
    });
  },

  completeRegistration: function (memberID, sessionID, body, callback) {
    var self = this;
    var registrationEvent;
    var registrationTuple = {
      sessionID: sessionID,
      activityUrl: body.activityUrl,
      resourceName: body.resourceName,
      desiredRoomTypes: body.desiredRoomTypes && body.desiredRoomTypes.split(','),
      duration: body.duration
    };
    eventstoreService.getRegistrationCommandProcessor(registrationTuple.activityUrl, function (err, commandProcessor) {
      if (err || !commandProcessor) { return callback(err); }

      if (registrationTuple.duration === 'waitinglist') {
        registrationEvent = commandProcessor.registerWaitinglistParticipant(registrationTuple.desiredRoomTypes, registrationTuple.sessionID, memberID);
      } else {
        registrationEvent = commandProcessor.registerParticipant(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID, memberID);
      }
      return eventstoreService.saveCommandProcessor(commandProcessor, function (err1) {
        if (err1 && err1.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.completeRegistration(memberID, sessionID, body, callback);
        }
        if (err1) { return callback(err1); }

        // error and success handling as indicated by the event:
        if (registrationEvent === eventConstants.PARTICIPANT_WAS_REGISTERED || registrationEvent === eventConstants.WAITINGLIST_PARTICIPANT_WAS_REGISTERED) {
          if (registrationTuple.duration === 'waitinglist') {
            socratesNotifications.newWaitinglistEntry(memberID, registrationTuple.desiredRoomTypes.map(roomType => roomOptions.waitinglistInformationFor(roomType)));
          } else {
            socratesNotifications.newParticipant(memberID, roomOptions.informationFor(registrationTuple.resourceName, registrationTuple.duration));
          }
          return subscriberstore.getSubscriber(memberID, function (err2, subscriber) {
            if (err2) { return callback(err2); }
            subscriber.fillFromUI(body);
            subscriberstore.saveSubscriber(subscriber, callback);
          });
        } else if (registrationEvent === eventConstants.DID_NOT_REGISTER_PARTICIPANT_FOR_FULL_RESOURCE) {
          // if the resource was full, this can only be due to the registration having timed out:
          var message = registrationTuple.duration === 'waitinglist' ? 'activities.waitinglist_registration_timed_out' : 'activities.registration_timed_out';
          return callback(null, 'message.title.problem', message);
          /*
          return subscriberstore.getSubscriber(memberID, function (err2, subscriber) {
            if (err2) { return callback(err2); }
            subscriber.fillFromUI(body);
            subscriberstore.saveSubscriber(subscriber, callback);
          });
          */
        } else if (registrationEvent === eventConstants.DID_NOT_REGISTER_PARTICIPANT_A_SECOND_TIME) {
          return callback(null, 'message.title.problem', 'activities.already_registered');
          /*
          return subscriberstore.getSubscriber(memberID, function (err2, subscriber) {
            if (err2) { return callback(err2); }
            subscriber.fillFromUI(body);
            subscriberstore.saveSubscriber(subscriber, callback);
          });
          */
        } else {
          callback(null, 'activities.registration_not_now', 'activities.registration_not_possible');
        }
      });
    });
  }

};
