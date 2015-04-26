'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var async = require('async');

var subscriberstore = beans.get('subscriberstore');
var notifications = beans.get('socratesNotifications');

module.exports = {

  addonLinesOf: function (activityWithParticipants, globalCallback) {
    async.map(activityWithParticipants.participants,
      function (member, callback) {
        subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
          if (err || !subscriber) { return callback(err); }
          var participation = subscriber.isParticipating() ? subscriber.currentParticipation() : {};

          callback(null, {member: member, addon: subscriber.addon(), participation: participation});
        });
      },
      globalCallback);
  },

  submitPaymentReceived: function (nickname, callback) {
    subscriberstore.getSubscriberByNickname(nickname, function (err, subscriber) {
      if (err || !subscriber) { return callback(err); }
      if (!subscriber.isParticipating()) {return callback(new Error(nickname + " is not participating!")); }
      subscriber.currentParticipation().payment().notePaymentReceived();
      subscriberstore.saveSubscriber(subscriber, function (err) {
        if (err) { return callback(err); }
        notifications.paymentMarked(nickname);
        callback(null);
      });
    });
  },

  tshirtSizes: function (addonLines) {
    var sizes = {};
    _.each(addonLines, function (line) {
      var size = line.addon.tShirtSize();
      var currentCount = sizes[size];
      if (currentCount) {
        sizes[size].count = currentCount.count + 1;
      } else {
        sizes[size] = {count: 1, size: size};
      }
    });
    return sizes;
  }

};
