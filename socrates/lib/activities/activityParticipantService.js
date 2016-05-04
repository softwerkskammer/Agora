'use strict';

var _ = require('lodash');
var R = require('ramda');
var async = require('async');
var beans = require('simple-configure').get('beans');
var subscriberstore = beans.get('subscriberstore');
var memberstore = beans.get('memberstore');
var activitystore = beans.get('activitystore');
var eventstoreService = beans.get('eventstoreService');
var Participation = beans.get('socratesParticipation');

var getMembers = function (memberIds, year, callback) {
  async.parallel({
    members: _.partial(memberstore.getMembersForIds, memberIds),
    subscribers: subscriberstore.allSubscribers
  }, function (err1, results) {
    if (err1) { return callback(err1); }
    _.each(results.members, function (member) {
      var subscriber = _.find(results.subscribers, function (sub) { return sub.id() === member.id(); });
      member.participation = subscriber ? subscriber.participationOf(year) : new Participation();
    });
    callback(null, results.members);
  });
};

module.exports = {

  getParticipantsFor: function (year, callback) {
    if (year < 2016) {
      activitystore.getActivity('socrates-' + year, function (err, activity) {
        if (err || !activity) { return callback(err); }
        return getMembers(activity.allRegisteredMembers(), year, callback);
      });
    } else {
      eventstoreService.getRegistrationReadModel('socrates-' + year, function (err, readModel) {
        if (err || !readModel) { return callback(err); }
        return getMembers(R.keys(readModel.participantsByMemberId()), year, callback);
      });
    }
  },

  getWaitinglistParticipantsFor: function (year, callback) {
    if (year < 2016) {
      activitystore.getActivity('socrates-' + year, function (err, activity) {
        if (err || !activity) { return callback(err); }
        return getMembers(activity.allWaitinglistEntries(), year, callback);
      });
    } else {
      eventstoreService.getRegistrationReadModel('socrates-' + year, function (err, readModel) {
        if (err || !readModel) { return callback(err); }
        return getMembers(R.keys(readModel.waitinglistParticipantsByMemberId()), year, callback);
      });
    }
  }
};
