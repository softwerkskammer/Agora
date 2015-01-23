'use strict';

var beans = require('simple-configure').get('beans');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var Subscriber = beans.get('subscriber');

module.exports = {

  createSubscriberIfNecessaryFor: function (id, callback) {
    subscriberstore.getSubscriber(id, function (err, particip) {
      if (err) { return callback(err); }
      if (!particip) {
        return subscriberstore.saveSubscriber(new Subscriber({id: id}), callback);
      }
      return callback(null);
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
  }

};