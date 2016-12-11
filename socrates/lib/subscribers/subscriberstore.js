'use strict';

const beans = require('simple-configure').get('beans');
const R = require('ramda');
const persistence = beans.get('subscribersPersistence');
const memberstore = beans.get('memberstore');
const Subscriber = beans.get('subscriber');
const misc = beans.get('misc');
const logger = require('winston').loggers.get('transactions');
const toSubscriber = R.partial(misc.toObject, [Subscriber]);

function toSubscriberList(callback, err, result) {
  if (err) { return callback(err); }
  callback(null, result.map(each => new Subscriber(each)));
}

module.exports = {
  allSubscribers: function allSubscribers(callback) {
    persistence.list({}, R.partial(toSubscriberList, [callback]));
  },

  getSubscriber: function getSubscriber(id, callback) {
    persistence.getById(id, R.partial(toSubscriber, [callback]));
  },

  getSubscriberByNickname: function getSubscriberByNickname(nickname, callback) {
    const self = this;
    memberstore.getMember(nickname, (err, member) => {
      if (err || !member) { return callback(err); }
      self.getSubscriber(member.id(), callback);
    });
  },

  removeSubscriber: function removeSubscriber(subscriber, callback) {
    persistence.remove(subscriber.id(), err => {
      logger.info('Subscriber removed: ' + JSON.stringify(subscriber));
      callback(err);
    });
  },

  saveSubscriber: function saveSubscriber(subscriber, callback) {
    persistence.save(subscriber.state, callback);
  }
};
