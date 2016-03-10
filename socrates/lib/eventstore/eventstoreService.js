'use strict';

var beans = require('simple-configure').get('beans');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');
var SoCraTesWriteModel = beans.get('SoCraTesWriteModel');
var SoCraTesCommandProcessor = beans.get('SoCraTesCommandProcessor');

module.exports = {
  isValidUrl: function (url, callback) {
    eventstore.getEventStore(url, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  getSoCraTesReadModel: function (url, callback) {
    eventstore.getEventStore(url, function (err, eventStore) {
      if (err) { return callback(err); }
      callback(null, new SoCraTesReadModel(eventStore));
    });
  },

  getSoCraTesCommandProcessor: function (url, callback) {
    eventstore.getEventStore(url, function (err, eventStore) {
      if (err) { return callback(err); }
      if (!eventStore) { eventStore = new GlobalEventStore(); }
      callback(null, new SoCraTesCommandProcessor(new SoCraTesWriteModel(eventStore)));
    });
  }
};
