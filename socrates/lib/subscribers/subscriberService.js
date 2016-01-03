'use strict';

var _ = require('lodash');
var async = require('async');

var beans = require('simple-configure').get('beans');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var Subscriber = beans.get('subscriber');

module.exports = {

  createSubscriberIfNecessaryFor: function (id, callback) {
    subscriberstore.getSubscriber(id, function (err, particip) {
      if (err) { return callback(err, true); }
      if (!particip) {
        return subscriberstore.saveSubscriber(new Subscriber({id: id}), callback);
      }
      return callback(null, true);
    });
  },

  getMemberIfSubscriberExists: function (nickname, callback) {
    memberstore.getMember(nickname, function (err, member) {
      if (err || !member) { return callback(err); }
      subscriberstore.getSubscriber(member.id(), function (err1, subscriber) {
        if (err1 || !subscriber) { return callback(err1); }
        callback(null, member);
      });
    });
  },

  getMembersAndSubscribersForIds: function (memberIds, globalCallback) {
    memberstore.getMembersForIds(memberIds, function (err, members) {
      if (err || !members) { return globalCallback(err); }
      async.map(members,
        function (member, callback) {
          subscriberstore.getSubscriber(member.id(), function (err1, subscriber) {
            if (err1 || !subscriber) { return callback(err1); }
            member.subscriber = subscriber;
            callback(null, member);
          });
        }, globalCallback);
    });
  },

  getMembersForSubscribers: function (subscribers, globalCallback) {
    async.map(subscribers,
      function (subscriber, callback) {
        memberstore.getMemberForId(subscriber.id(), function (err1, member) {
          if (err1 || !member) { return callback(err1); }
          member.subscriber = subscriber;
          callback(null, member);
        });
      }, globalCallback);
  },

  emailAddressesForWikiNotifications: function (globalCallback) {
    subscriberstore.allSubscribers(function (err, subscribers) {
      if (err || !subscribers) { return globalCallback(err); }
      var memberIds = _(subscribers).filter(function (subscriber) { return subscriber.notifyOnWikiChangesSoCraTes(); }).map(function (subscriber) {return subscriber.id(); }).value();
      memberstore.getMembersForIds(memberIds, function (err1, members) {
        if (err1) { return globalCallback(err1); }
        globalCallback(null, _.map(members, function (member) { return member.email(); }));
      });
    });
  },

  removeSubscriber: function (subscriber, callback) {
    subscriberstore.removeSubscriber(subscriber, function (err) {
      if (err) { return callback(err); }
      memberstore.getMemberForId(subscriber.id(), function (err1, member) {
        if (err1) { return callback(err1); }
        if (member.socratesOnly()) {
          return memberstore.removeMember(subscriber, function (err2) {
            if (err2) { return callback(err2); }
            callback(null);
          });
        }
        callback(null);
      });
    });

  }

};
