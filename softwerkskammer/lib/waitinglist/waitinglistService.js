'use strict';

var async = require('async');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var memberstore = beans.get('memberstore');
var activitystore = beans.get('activitystore');
var mailsenderService = beans.get('mailsenderService');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

module.exports = {
  waitinglistFor: function (activityUrl, globalCallback) {
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err) { return globalCallback(err); }
      async.map(activity.allWaitinglistEntries(), function (waitinglistEntry, callback) {
        memberstore.getMemberForId(waitinglistEntry.registrantId(), function (err1, member) {
          if (err1 || !member) { return callback(err1); }
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
        member: function (cb) { memberstore.getMember(args.nickname, cb); },
        activity: function (cb) { activitystore.getActivity(args.activityUrl, cb); }
      },
      function (err, results) {
        if (err || !results.member || !results.activity) { return callback(err); }
        results.activity.resourceNamed(args.resourcename).addToWaitinglist(results.member.id(), moment());
        activitystore.saveActivity(results.activity, function (err1) {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.saveWaitinglistEntry(args, callback);
          }
          return callback(err1);
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
        activitystore.saveActivity(results.activity, function (err1) {
          if (err1 && err1.message === CONFLICTING_VERSIONS) {
            // we try again because of a racing condition during save:
            return self.allowRegistrationForWaitinglistEntry(args, outerCallback);
          }
          if (err1) { return outerCallback(err1); }
          mailsenderService.sendRegistrationAllowed(results.member, results.activity, entry, outerCallback);
        });
      }
    );
  }
};

