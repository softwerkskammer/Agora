'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var async = require('async');

var subscriberstore = beans.get('subscriberstore');

module.exports = {

  addonLinesOf: function (members, globalCallback) {
    async.map(members,
      function (member, callback) {
        subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
          if (err || !subscriber) { return callback(err); }
          var participation = subscriber.isParticipating() ? subscriber.currentParticipation() : {};

          callback(null, {member: member, addon: subscriber.addon(), participation: participation, subscriber: subscriber});
        });
      },
      globalCallback);
  },

  addonLinesOfMembersWithSubscribers: function (members) {
    return _.map(members, function (member) {
        var participation = member.subscriber.isParticipating() ? member.subscriber.currentParticipation() : {};
        return {member: member, addon: member.subscriber.addon(), participation: participation};
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
  },

  durations: function (registrationReadModel) {
    var durations = registrationReadModel.durations();

    function count(index) { return durations[index] ? durations[index].count : 0; }

    if (durations[2]) { durations[2].total = count(2) + count(3) + count(4) + count(5); }
    if (durations[3]) { durations[3].total = count(3) + count(4) + count(5); }
    if (durations[4]) { durations[4].total = count(4) + count(5); }
    if (durations[5]) { durations[5].total = count(5); }

    return durations;
  }

};
