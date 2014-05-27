'use strict';

var async = require('async');
var moment = require('moment-timezone');

var beans = require('nconf').get('beans');
var memberstore = beans.get('memberstore');
var activitystore = beans.get('activitystore');
var mailsenderAPI = beans.get('mailsenderAPI');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

module.exports = {
  waitinglistFor: function (activityUrl, globalCallback) {
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err) { return globalCallback(err); }
      async.map(activity.allWaitinglistEntries(), function (waitinglistEntry, callback) {
        memberstore.getMemberForId(waitinglistEntry.registrantId(), function (err, member) {
          if (err || !member) { return callback(err); }
          waitinglistEntry.registrantNickname = member.nickname();
          callback(null, waitinglistEntry);
        });
      }, globalCallback);
    });
  },

  saveWaitinglistEntry: function (args, callback) {
    var self = this;
    async.parallel(
      {
        member: function (callback) { memberstore.getMember(args.nickname, callback); },
        activity: function (callback) { activitystore.getActivity(args.activityUrl, callback); }
      },
      function (err, results) {
        if (err || !results.member || !results.activity) { return callback(err); }
        results.activity.resourceNamed(args.resourcename).addToWaitinglist(results.member.id(), moment());
        activitystore.saveActivity(results.activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.saveWaitinglistEntry(args, callback);
          }
          return callback(err);
        });
      }
    );
  },

  allowRegistrationForWaitinglistEntry: function (args, outerCallback) {
    var self = this;
    async.parallel(
      {
        member: function (callback) { memberstore.getMember(args.nickname, callback); },
        activity: function (callback) { activitystore.getActivity(args.activityUrl, callback); }
      },
      function (err, results) {
        if (err || !results.member || !results.activity) { return outerCallback(err); }
        var entry = results.activity.resourceNamed(args.resourcename).waitinglistEntryFor(results.member.id());
        if (!entry) { return outerCallback(null); }
        entry.setRegistrationValidityFor(args.hoursstring);
        activitystore.saveActivity(results.activity, function (err) {
          if (err && err.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.allowRegistrationForWaitinglistEntry(args, outerCallback);
          }
          if (err) { return outerCallback(err); }
          mailsenderAPI.sendRegistrationAllowed(results.member, results.activity, entry, outerCallback);
        });
      }
    );
  }
};

