'use strict';

const async = require('async');

const beans = require('simple-configure').get('beans');
const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');
const Subscriber = beans.get('subscriber');

module.exports = {

  createSubscriberIfNecessaryFor: function createSubscriberIfNecessaryFor(id, callback) {
    subscriberstore.getSubscriber(id, (err, particip) => {
      if (err) { return callback(err, true); }
      if (!particip) {
        return subscriberstore.saveSubscriber(new Subscriber({id: id}), callback);
      }
      return callback(null, true);
    });
  },

  getMemberIfSubscriberExists: function getMemberIfSubscriberExists(nickname, callback) {
    memberstore.getMember(nickname, (err, member) => {
      if (err || !member) { return callback(err); }
      subscriberstore.getSubscriber(member.id(), (err1, subscriber) => {
        if (err1 || !subscriber) { return callback(err1); }
        callback(null, member);
      });
    });
  },

  getMembersAndSubscribersForIds: function getMembersAndSubscribersForIds(memberIds, globalCallback) {
    memberstore.getMembersForIds(memberIds, (err, members) => {
      if (err || !members) { return globalCallback(err); }
      async.map(members,
        (member, callback) => {
          subscriberstore.getSubscriber(member.id(), (err1, subscriber) => {
            if (err1 || !subscriber) { return callback(err1); }
            member.subscriber = subscriber;
            callback(null, member);
          });
        }, globalCallback);
    });
  },

  getMembersForSubscribers: function getMembersForSubscribers(subscribers, globalCallback) {
    async.map(subscribers,
      (subscriber, callback) => {
        memberstore.getMemberForId(subscriber.id(), (err1, member) => {
          if (err1 || !member) { return callback(err1); }
          member.subscriber = subscriber;
          callback(null, member);
        });
      }, globalCallback);
  },

  emailAddressesForWikiNotifications: function emailAddressesForWikiNotifications(globalCallback) {
    subscriberstore.allSubscribers((err, subscribers) => {
      if (err || !subscribers) { return globalCallback(err); }
      const memberIds = subscribers.filter(subscriber => subscriber.notifyOnWikiChangesSoCraTes()).map(subscriber => subscriber.id());
      memberstore.getMembersForIds(memberIds, (err1, members) => {
        if (err1) { return globalCallback(err1); }
        globalCallback(null, members.map(member => member.email()));
      });
    });
  },

  removeSubscriber: function removeSubscriber(subscriber, callback) {
    subscriberstore.removeSubscriber(subscriber, err => {
      if (err) { return callback(err); }
      memberstore.getMemberForId(subscriber.id(), (err1, member) => {
        if (err1) { return callback(err1); }
        if (member.socratesOnly()) {
          return memberstore.removeMember(subscriber, err2 => {
            if (err2) { return callback(err2); }
            callback(null);
          });
        }
        callback(null);
      });
    });

  }

};
