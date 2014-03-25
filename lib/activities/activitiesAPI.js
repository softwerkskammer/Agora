"use strict";

var async = require('async');
var _ = require('lodash');
var moment = require('moment-timezone');

var conf = require('nconf');
var beans = conf.get('beans');

var activitystore = beans.get('activitystore');
var groupsAPI = beans.get('groupsAPI');
var membersAPI = beans.get('membersAPI');
var notifications = beans.get('notifications');
var stripe = require('stripe');

module.exports = {
  getActivitiesForDisplay: function (activitiesFetcher, callback) {
    async.parallel(
      { activities: activitiesFetcher,
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); },
        groupColors: function (callback) { groupsAPI.allGroupColors(callback); }
      },

      function (err, results) {
        if (err) { callback(err); }
        _.each(results.activities, function (activity) {
          activity.colorRGB = activity.colorFrom(results.groupColors);
        });
        _.each(results.activities, function (activity) {
          activity.group = activity.groupFrom(results.groups);
        });
        callback(null, results.activities);
      });
  },

  getActivityWithGroupAndParticipants: function (url, callback) {
    activitystore.getActivity(url, function (err, activity) {
      if (err || !activity) { return callback(err); }

      async.parallel({
          group: function (callback) { groupsAPI.getGroup(activity.assignedGroup(), callback); },
          participants: function (callback) { membersAPI.getMembersForIds(activity.allRegisteredMembers(), callback); },
          owner: function (callback) { membersAPI.getMemberForId(activity.owner(), callback); }
        },

        function (err, results) {
          if (err) {return callback(err); }
          activity.group = results.group;
          activity.participants = results.participants;
          activity.ownerNickname = results.owner ? results.owner.nickname() : undefined;
          callback(null, activity);
        });
    });
  },

  isValidUrl: function (reservedURLs, url, callback) {
    var isReserved = new RegExp(reservedURLs, 'i').test(url);
    if (isReserved) { return callback(null, false); }
    activitystore.getActivity(url, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  activitiesBetween: function (startMoment, endMoment, callback) {
    activitystore.allActivitiesByDateRangeInAscendingOrder(startMoment.unix(), endMoment.unix(), callback);
  },

  addVisitorTo: function (memberId, activityUrl, resourceName, moment, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var resource = activity.resourceNamed(resourceName);
      var waitinglistEntry = resource.waitinglistEntryFor(memberId);
      var canSubscribe = waitinglistEntry ? waitinglistEntry.canSubscribe() : false;
      if (resource.isRegistrationOpen() || canSubscribe) {
        resource.addMemberId(memberId, moment);
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === "Conflicting versions.") {
            // we try again because of a racing condition during save:
            return self.addVisitorTo(memberId, activityUrl, resourceName, moment, callback);
          }
          notifications.visitorRegistration(activity, memberId, resourceName);
          return callback(err);
        });
      }
      return callback(null, "activities.registration_not_now", "activities.registration_not_possible");
    });
  },

  removeVisitorFrom: function (memberId, activityUrl, resourceName, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err) {return callback(err); }
      activity.resourceNamed(resourceName).removeMemberId(memberId);
      activitystore.saveActivity(activity, function (err) {
        if (err && err.message === "Conflicting versions.") {
          // we try again because of a racing condition during save:
          return self.removeVisitorFrom(memberId, activityUrl, resourceName, callback);
        }
        notifications.visitorUnregistration(activity, memberId, resourceName);
        return callback(err);
      });
    });
  },

  addToWaitinglist: function (memberId, activityUrl, resourceName, moment, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var resource = activity.resourceNamed(resourceName);
      if (resource.hasWaitinglist()) {
        resource.addToWaitinglist(memberId, moment);
        return activitystore.saveActivity(activity, function (err) {
          if (err && err.message === "Conflicting versions.") {
            // we try again because of a racing condition during save:
            return self.addToWaitinglist(memberId, activityUrl, resourceName, moment, callback);
          }
          notifications.waitinglistAddition(activity, memberId, resourceName);
          return callback(err);
        });
      }
      return callback(null, "activities.waitinglist_not_possible", "activities.no_waitinglist");
    });
  },

  removeFromWaitinglist: function (memberId, activityUrl, resourceName, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var resource = activity.resourceNamed(resourceName);
      resource.removeFromWaitinglist(memberId);
      return activitystore.saveActivity(activity, function (err) {
        if (err && err.message === "Conflicting versions.") {
          // we try again because of a racing condition during save:
          return self.removeFromWaitinglist(memberId, activityUrl, resourceName, callback);
        }
        notifications.waitinglistRemoval(activity, memberId, resourceName);
        return callback(err);
      });
    });
  },

  addonForMember: function (activityUrl, memberId, callback) {
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      return callback(null, activity.addonForMember(memberId), activity.addonConfig());
    });
  },

  saveAddon: function (activityUrl, memberId, uiInputObject, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      activity.addonForMember(memberId).fillFromUI(uiInputObject);
      return activitystore.saveActivity(activity, function (err) {
        if (err && err.message === "Conflicting versions.") {
          // we try again because of a racing condition during save:
          return self.saveAddon(activityUrl, memberId, uiInputObject, callback);
        }
        return callback(err);
      });
    });
  },

  payWithCreditCard: function (activityUrl, memberId, stripeId, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var amount = activity.addonConfig().deposit() || 150;
      var transaction = stripe(conf.get('secretPaymentKey'));
      var charge = { amount: amount * 100, currency: 'EUR', card: stripeId };
      transaction.charges.create(charge, function (err, charge) {
        if (err) { return callback(err); }
        var addon = activity.addonForMember(memberId);
        addon.state.creditCardPaid = moment();
        self.saveAddon(activityUrl, memberId, addon.state, function (err) {
          callback(err, charge);
        });
      });
    });
  },

  payWithTransfer: function (activityUrl, memberId, callback) {
    var self = this;
    self.addonForMember(activityUrl, memberId, function (err, addon) {
      if (err) { return callback(err); }
      addon.state.moneyTransferred = moment();
      self.saveAddon(activityUrl, memberId, addon.state, callback);
    });
  }

};
