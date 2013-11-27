"use strict";

var async = require('async');
var moment = require('moment-timezone');

//var util = require('util');

var beans = require('nconf').get('beans');
var store = beans.get('waitinglistStore');
var membersAPI = beans.get('membersAPI');
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
      }, globalCallback);
    });
  },

  saveWaitinglistEntry: function (args, callback) {
    membersAPI.getMember(args.nickname, function (err, member) {
      if (err) { return callback(err); }
      var entry = new WaitinglistEntry({
        _registrantId: member.id,
        _activityName: args.activityname,
        _resourceName: args.resourcename,
        _registrationDate: moment().toDate()
      });
      entry.setRegistrationValidityFor(args.hoursstring);
      store.saveWaitinglistEntry(entry, callback);
    });
  },

  canSubscribe: function (memberId, activityUrl, resourceName, callback) {
    var searchObject = { _registrantId: memberId,
      _activityName: activityUrl,
      _resourceName: resourceName };
    store.waitinglistEntry(searchObject, function (err, waitinglistEntry) {
      if (err || !waitinglistEntry) { return callback(err, false); }
      var now = moment();
      var latestPossibilityToRegister = waitinglistEntry.registrationValidUntil();
      return callback(err, now.isBefore(latestPossibilityToRegister));
    });
  }

};

