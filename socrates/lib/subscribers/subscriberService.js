'use strict';

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
  }

};
