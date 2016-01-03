'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var persistence = beans.get('subscribersPersistence');
var memberstore = beans.get('memberstore');
var Subscriber = beans.get('subscriber');
var misc = beans.get('misc');
var logger = require('winston').loggers.get('transactions');
var toSubscriber = _.partial(misc.toObject, Subscriber);

var toSubscriberList = function (callback, err, result) {
  if (err) { return callback(err); }
  callback(null, _.map(result, function (each) { return new Subscriber(each); }));
};

module.exports = {
  allSubscribers: function (callback) {
    persistence.list({}, _.partial(toSubscriberList, callback));
  },

  getSubscriber: function (id, callback) {
    persistence.getById(id, _.partial(toSubscriber, callback));
  },

  getSubscriberByNickname: function (nickname, callback) {
    var self = this;
    memberstore.getMember(nickname, function (err, member) {
      if (err || !member) { return callback(err); }
      self.getSubscriber(member.id(), callback);
    });
  },

  removeSubscriber: function (subscriber, callback) {
    persistence.remove(subscriber.id(), function (err) {
      logger.info('Subscriber removed: ' + JSON.stringify(subscriber));
      callback(err);
    });
  },

  saveSubscriber: function (subscriber, callback) {
    persistence.save(subscriber.state, callback);
  }
};
