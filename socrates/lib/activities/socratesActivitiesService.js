'use strict';

var beans = require('simple-configure').get('beans');
var subscriberstore = beans.get('subscriberstore');
var memberstore = beans.get('memberstore');
var activitiesService = beans.get('activitiesService');
var activitystore = beans.get('activitystore');
var notifications = beans.get('socratesNotifications');
var roomOptions = beans.get('roomOptions');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

var currentUrl = beans.get('socratesConstants').currentUrl;

module.exports = {

  submitPaymentReceived: function (nickname, callback) {
    subscriberstore.getSubscriberByNickname(nickname, function (err, subscriber) {
      if (err || !subscriber) { return callback(err); }
      if (!subscriber.isParticipating()) {return callback(new Error(nickname + " is not participating!")); }
      subscriber.currentParticipation().payment().notePaymentReceived();
      subscriberstore.saveSubscriber(subscriber, function (err) {
        if (err) { return callback(err); }
        notifications.paymentMarked(nickname);
        callback(null);
      });
    });
  },

  fromWaitinglistToParticipant: function (nickname, registrationTuple, callback) {
    var self = this;

    activitystore.getActivity(registrationTuple.activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }

      memberstore.getMember(nickname, function (err, member) {
        if (err || !member) { return callback(err); }

        activity.register(member.id(), registrationTuple);
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.fromWaitinglistToParticipant(member.id(), registrationTuple, callback);
          }
          if (err) { return callback(err); }

          var bookingdetails = roomOptions.informationFor(registrationTuple.resourceName, registrationTuple.duration);
          bookingdetails.fromWaitinglist = true;
          notifications.newParticipant(member.id(), bookingdetails);
          return callback();
        });
      });
    });
  },

  newDurationFor: function (nickname, resourceName, duration, callback) {
    var self = this;
    activitystore.getActivity(currentUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMember(nickname, function (err, member) {
        if (err || !member) { return callback(err); }
        activity.socratesResourceNamed(resourceName).recordFor(member.id()).duration = duration;
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.newDurationFor(nickname, resourceName, duration, callback);
          }
          if (err) { return callback(err); }
          notifications.changedDuration(member, roomOptions.informationFor(resourceName, duration));
          return callback();
        });
      });

    });
  },

  newResourceFor: function (nickname, resourceName, newResourceName, callback) {
    var self = this;
    activitystore.getActivity(currentUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMember(nickname, function (err, member) {
        if (err || !member) { return callback(err); }
        var oldResource = activity.socratesResourceNamed(resourceName);
        var registrationRecord = oldResource.recordFor(member.id());
        oldResource.removeMemberId(member.id());
        activity.socratesResourceNamed(newResourceName).addRecord(registrationRecord);
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.newResourceFor(nickname, resourceName, newResourceName, callback);
          }
          if (err) { return callback(err); }
          notifications.changedResource(member, roomOptions.informationFor(newResourceName, registrationRecord.duration));
          return callback();
        });
      });

    });
  },

  newWaitinglistFor: function (nickname, resourceName, newResourceName, callback) {
    var self = this;
    activitystore.getActivity(currentUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMember(nickname, function (err, member) {
        if (err || !member) { return callback(err); }
        var oldResource = activity.socratesResourceNamed(resourceName);
        var waitinglistRecord = oldResource.waitinglistRecordFor(member.id());
        oldResource.removeFromWaitinglist(member.id());
        activity.socratesResourceNamed(newResourceName).addWaitinglistRecord(waitinglistRecord);
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.newResourceFor(nickname, resourceName, newResourceName, callback);
          }
          if (err) { return callback(err); }
          notifications.changedWaitinglist(member, roomOptions.informationFor(newResourceName, 'waitinglist'));
          return callback();
        });
      });

    });
  },

  newParticipantPairFor: function (resourceName, participant1Nick, participant2Nick, callback) {
    var self = this;
    activitystore.getActivity(currentUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMember(participant1Nick, function (err, participant1) {
        if (err || !participant1) { return callback(err); }
        memberstore.getMember(participant2Nick, function (err, participant2) {
          if (err || !participant2) { return callback(err); }
          activity.rooms(resourceName).add(participant1.id(), participant2.id());
          return activitystore.saveActivity(activity, function (err) {
            if (err && err.message === CONFLICTING_VERSIONS) {
              // we try again because of a racing condition during save:
              return self.newParticipantPairFor(resourceName, participant1Nick, participant2Nick, callback);
            }
            return callback(err);
          });

        });
      });
    });
  },

  removeParticipantPairFor: function (resourceName, participant1Nick, participant2Nick, callback) {
    var self = this;
    activitystore.getActivity(currentUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMember(participant1Nick, function (err, participant1) {
        if (err || !participant1) { return callback(err); }
        memberstore.getMember(participant2Nick, function (err, participant2) {
          if (err || !participant2) { return callback(err); }
          activity.rooms(resourceName).remove(participant1.id(), participant2.id());
          return activitystore.saveActivity(activity, function (err) {
            if (err && err.message === CONFLICTING_VERSIONS) {
              // we try again because of a racing condition during save:
              return self.removeParticipantPairFor(resourceName, participant1Nick, participant2Nick, callback);
            }
            return callback(err);
          });

        });
      });
    });
  }

};
