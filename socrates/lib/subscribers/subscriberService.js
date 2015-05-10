'use strict';

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
      subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
        if (err || !subscriber) { return callback(err); }
        callback(null, member);
      });
    });
  },

  getMembersAndSubscribersForIds: function (memberIds, globalCallback) {
    memberstore.getMembersForIds(memberIds, function (err, members) {
      if (err || !members) { return globalCallback(err); }
      async.map(members,
        function (member, callback) {
          subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
            if (err || !subscriber) { return callback(err); }
            member.subscriber = subscriber;
            callback(null, member);
          });
        }, globalCallback);
    });
  }

};