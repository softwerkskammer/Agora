'use strict';

var beans = require('simple-configure').get('beans');
var subscriberstore = beans.get('subscriberstore');
var notifications = beans.get('socratesNotifications');

module.exports = {

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
  }
};
