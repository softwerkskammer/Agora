'use strict';

const R = require('ramda');
const async = require('async');
const beans = require('simple-configure').get('beans');
const subscriberstore = beans.get('subscriberstore');
const memberstore = beans.get('memberstore');
const activitystore = beans.get('activitystore');
const eventstoreService = beans.get('eventstoreService');
const Participation = beans.get('socratesParticipation');

function getMembers(memberIds, year, callback) {
  async.parallel({
    members: R.partial(memberstore.getMembersForIds, [memberIds]),
    subscribers: subscriberstore.allSubscribers
  }, (err1, results) => {
    if (err1) { return callback(err1); }
    results.members.forEach(member => {
      const subscriber = results.subscribers.find(sub => sub.id() === member.id());
      member.participation = subscriber ? subscriber.participationOf(year) : new Participation();
    });
    callback(null, results.members);
  });
}

module.exports = {

  getParticipantsFor: function getParticipantsFor(year, callback) {
    if (year < 2016) {
      activitystore.getActivity('socrates-' + year, (err, activity) => {
        if (err || !activity) { return callback(err); }
        return getMembers(activity.allRegisteredMembers(), year, callback);
      });
    } else {
      eventstoreService.getRegistrationReadModel('socrates-' + year, (err, readModel) => {
        if (err || !readModel) { return callback(err); }
        return getMembers(readModel.registeredMemberIds(), year, callback);
      });
    }
  },

  getWaitinglistParticipantsFor: function getWaitinglistParticipantsFor(year, callback) {
    if (year < 2016) {
      activitystore.getActivity('socrates-' + year, (err, activity) => {
        if (err || !activity) { return callback(err); }
        return getMembers(activity.allWaitinglistEntries(), year, callback);
      });
    } else {
      eventstoreService.getRegistrationReadModel('socrates-' + year, (err, readModel) => {
        if (err || !readModel) { return callback(err); }
        return getMembers(R.keys(readModel.waitinglistParticipantsByMemberId()), year, callback);
      });
    }
  }
};
