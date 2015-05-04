'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var async = require('async');

var subscriberstore = beans.get('subscriberstore');
var notifications = beans.get('socratesNotifications');
var roomOptions = beans.get('roomOptions');

module.exports = {

  addonLinesOf: function (members, globalCallback) {
    async.map(members,
      function (member, callback) {
        subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
          if (err || !subscriber) { return callback(err); }
          var participation = subscriber.isParticipating() ? subscriber.currentParticipation() : {};

          callback(null, {member: member, addon: subscriber.addon(), participation: participation});
        });
      },
      globalCallback);
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
  },

  durations: function (activity) {
    var durations = {};
    _.each(activity.resourceNames(), function (resourceName) {
      _.each(activity.socratesResourceNamed(resourceName).durations(), function (duration) {
        var currentCount = durations[duration];
        if (currentCount) {
          durations[duration].count = currentCount.count + 1;
        } else {
          durations[duration] = {count: 1, duration: roomOptions.endOfStayFor(duration)};
        }
      });
    });
    return durations;
  }

};
