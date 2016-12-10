'use strict';

const beans = require('simple-configure').get('beans');
const async = require('async');

const subscriberstore = beans.get('subscriberstore');

module.exports = {

  addonLinesOf: function addonLinesOf(members, globalCallback) {
    async.map(members,
      (member, callback) => {
        subscriberstore.getSubscriber(member.id(), (err, subscriber) => {
          if (err || !subscriber) { return callback(err); }
          const participation = subscriber.isParticipating() ? subscriber.currentParticipation() : {};

          callback(null, {member: member, addon: subscriber.addon(), participation: participation, subscriber: subscriber});
        });
      },
      globalCallback);
  },

  addonLinesOfMembersWithSubscribers: function addonLinesOfMembersWithSubscribers(members) {
    return members.map(member => {
      const participation = member.subscriber.isParticipating() ? member.subscriber.currentParticipation() : {};
      return {member: member, addon: member.subscriber.addon(), participation: participation};
    });
  },

  tshirtSizes: function tshirtSizes(addonLines) {
    const sizes = {};
    addonLines.forEach(line =>{
      const size = line.addon.tShirtSize();
      const currentCount = sizes[size];
      if (currentCount) {
        sizes[size].count = currentCount.count + 1;
      } else {
        sizes[size] = {count: 1, size: size};
      }
    });
    return sizes;
  },

  durations: function durations(registrationReadModel) {
    const modeldurations = registrationReadModel.durations();

    function count(index) { return modeldurations[index] ? modeldurations[index].count : 0; }

    if (modeldurations[2]) { modeldurations[2].total = count(2) + count(3) + count(4) + count(5); }
    if (modeldurations[3]) { modeldurations[3].total = count(3) + count(4) + count(5); }
    if (modeldurations[4]) { modeldurations[4].total = count(4) + count(5); }
    if (modeldurations[5]) { modeldurations[5].total = count(5); }

    return modeldurations;
  }

};
