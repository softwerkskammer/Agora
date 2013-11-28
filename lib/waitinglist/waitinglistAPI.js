"use strict";

var async = require('async');
var moment = require('moment-timezone');

//var util = require('util');

var beans = require('nconf').get('beans');
var store = beans.get('waitinglistStore');
var membersAPI = beans.get('membersAPI');
var activitystore = beans.get('activitystore');
var WaitinglistEntry = beans.get('waitinglistEntry');

module.exports = {
  waitinglist: function (globalCallback) {
    store.waitinglist(function (err, waitinglist) {
      if (err) { return globalCallback(err); }
      async.map(waitinglist, function (waitinglistEntry, callback) {
        membersAPI.getMemberForId(waitinglistEntry.registrantId(), function (err, member) {
          if (err || !member) { return callback(err); }
          waitinglistEntry.registrantNickname = member.nickname;
          callback(null, waitinglistEntry);
        });
      }, function (err, waitinglist) {
        if (err || !waitinglist) { return globalCallback(err); }
        async.map(waitinglist, function (waitinglistEntry, callback) {
          activitystore.getActivityForId(waitinglistEntry.activityId(), function (err, activity) {
            if (err || !activity) { return callback(err); }
            waitinglistEntry.activityUrl = activity.url();
            callback(null, waitinglistEntry);
          });
        }, globalCallback);
      });
    });
  },

  saveWaitinglistEntry: function (args, callback) {
    async.parallel({
        member: function (callback) { membersAPI.getMember(args.nickname, callback); },
        activity: function (callback) { activitystore.getActivity(args.activityUrl, callback); }
      },
      function (err, results) {
        if (err) { return callback(err); }
        var entry = new WaitinglistEntry({
          _registrantId: results.member.id,
          _activityId: results.activity.id(),
          _resourceName: args.resourcename,
          _registrationDate: moment().toDate()
        });
        entry.setRegistrationValidityFor(args.hoursstring);
        store.saveWaitinglistEntry(entry, callback);
      });
  },

  canSubscribe: function (memberId, activityId, resourceName, callback) {
    store.waitinglistEntry(memberId, activityId, resourceName, function (err, waitinglistEntry) {
      if (err || !waitinglistEntry) { return callback(err, false); }
      var now = moment();
      var latestPossibilityToRegister = waitinglistEntry.registrationValidUntil();
      return callback(err, now.isBefore(latestPossibilityToRegister));
    });
  }

};

