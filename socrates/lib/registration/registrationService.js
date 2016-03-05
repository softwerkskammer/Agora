'use strict';

var beans = require('simple-configure').get('beans');

var activitystore = beans.get('activitystore');
var subscriberstore = beans.get('subscriberstore');
var socratesNotifications = beans.get('socratesNotifications');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var roomOptions = beans.get('roomOptions');

var eventstore = beans.get('eventstore');
var eventConstants = beans.get('eventConstants');

module.exports = {

  startRegistration: function (registrationTuple, callback) {
    var self = this;
    var reservationEvent;
    eventstore.getEventStore(registrationTuple.activityUrl, function (err, socratesEventStore) {
      if (err || !socratesEventStore) { return callback(err, 'message.title.problem', 'message.content.activities.does_not_exist'); }
      if (registrationTuple.duration === 'waitinglist') {
        reservationEvent = socratesEventStore.issueWaitinglistReservation(registrationTuple.resourceName, registrationTuple.sessionID);
      } else {
        reservationEvent = socratesEventStore.issueReservation(registrationTuple.resourceName, registrationTuple.duration, registrationTuple.sessionID);
      }
      return eventstore.saveEventStore(socratesEventStore, function (err1) {
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

  saveRegistration: function (memberID, sessionID, body, callback) {
    var self = this;
    var registrationTuple = {
      sessionID: sessionID,
      activityUrl: body.activityUrl,
      resourceName: body.resourceName,
      duration: body.duration
    };
    activitystore.getActivity(registrationTuple.activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      if (!activity.hasValidReservationFor(registrationTuple)) {
        var message = registrationTuple.duration === 'waitinglist' ? 'activities.waitinglist_registration_timed_out' : 'activities.registration_timed_out';
        return callback(null, 'message.title.problem', message);
      }
      if (activity.isAlreadyRegistered(memberID)) {
        return callback(null, 'message.title.problem', 'activities.already_registered');
      }
      if (activity.register(memberID, registrationTuple)) {
        return activitystore.saveActivity(activity, function (err1) {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.saveRegistration(memberID, sessionID, body, callback);
          }
          if (err1) { return callback(err1); }
          if (registrationTuple.duration === 'waitinglist') {
            socratesNotifications.newWaitinglistEntry(memberID, roomOptions.waitinglistInformationFor(registrationTuple.resourceName));
          } else {
            socratesNotifications.newParticipant(memberID, roomOptions.informationFor(registrationTuple.resourceName, registrationTuple.duration));
          }
          return subscriberstore.getSubscriber(memberID, function (err2, subscriber) {
            if (err2) { return callback(err2); }
            subscriber.fillFromUI(body);
            subscriberstore.saveSubscriber(subscriber, callback);
          });
        });

      }
      callback(null, 'activities.registration_not_now', 'activities.registration_not_possible');
    });

  }

};
