'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var persistence = beans.get('subscribersPersistence');
var Subscriber = beans.get('subscriber');
var misc = beans.get('misc');
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

  saveSubscriber: function (subscriber, callback) {
    persistence.save(subscriber.state, callback);
  }
};