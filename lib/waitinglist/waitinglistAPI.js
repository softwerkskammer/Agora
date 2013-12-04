"use strict";

var async = require('async');
var moment = require('moment-timezone');
var _ = require('underscore');

//var util = require('util');

var beans = require('nconf').get('beans');
var store = beans.get('waitinglistStore');
var membersAPI = beans.get('membersAPI');
var activitystore = beans.get('activitystore');
var mailsenderAPI = beans.get('mailsenderAPI');


module.exports = {
  waitinglistFor: function (activityUrl, callback) {
    var waitinglistEnrichedWithNickname = function (globalCallback) {
      return function (err, waitinglistEntries) {
        if (err) { return globalCallback(err); }
        async.map(_.compact(waitinglistEntries), function (waitinglistEntry, callback) {
          membersAPI.getMemberForId(waitinglistEntry.registrantId(), function (err, member) {
            if (err || !member) { return callback(err); }
            waitinglistEntry.registrantNickname = member.nickname;
            callback(null, waitinglistEntry);
          });
        }, globalCallback);
      };
    };

    activitystore.getActivity(activityUrl, function (err, activity) {
      waitinglistEnrichedWithNickname(callback)(err, activity.allWaitinglistEntries());
    });
  },

  saveWaitinglistEntry: function (args, callback) {
    async.parallel({
        member: function (callback) { membersAPI.getMember(args.nickname, callback); },
        activity: function (callback) { activitystore.getActivity(args.activityUrl, callback); }
      },
      function (err, results) {
        if (err || !results.member || !results.activity) { return callback(err); }
        results.activity.resources().named(args.resourcename).addToWaitinglist(results.member.id, moment());
        activitystore.saveActivity(results.activity, callback);
      });
  },

  allowRegistrationForWaitinglistEntry: function (args, outerCallback) {
    async.parallel({
        member: function (callback) { membersAPI.getMember(args.nickname, callback); },
        activity: function (callback) { activitystore.getActivity(args.activityUrl, callback); }
      },
      function (err, results) {
        if (err || !results.member || !results.activity) { return outerCallback(err); }
        store.waitinglistEntry(results.member.id, results.activity.id(), args.resourcename, function (err, entry) {
          entry.setRegistrationValidityFor(args.hoursstring);
          store.saveWaitinglistEntry(entry, function (err) {
            if (err) { return outerCallback(err); }
            mailsenderAPI.sendRegistrationAllowed(results.member, results.activity, entry, outerCallback);
          });
        });
      });
  },

  canSubscribe: function (memberId, activityId, resourceName, callback) {
    activitystore.getActivityForId(activityId, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var waitinglistEntry = activity.resources().named(resourceName).waitinglistEntryFor(memberId);
      return callback(null, waitinglistEntry ? waitinglistEntry.canSubscribe() : false);
    });
  }

};

