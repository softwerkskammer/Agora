'use strict';

var beans = require('simple-configure').get('beans');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');
var SoCraTesWriteModel = beans.get('SoCraTesWriteModel');
var SoCraTesCommandProcessor = beans.get('SoCraTesCommandProcessor');
var RegistrationReadModel = beans.get('RegistrationReadModel');

module.exports = {
  isValidUrl: function (url, callback) {
    eventstore.getEventStore(url, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  getSoCraTesReadModel: function (url, callback) {
    eventstore.getEventStore(url, function (err, eventStore) {
      if (err || eventStore === null) { return callback(err); }
      callback(null, new SoCraTesReadModel(eventStore));
    });
  },

  newSoCraTesReadModel: function () {
    return new SoCraTesReadModel(new GlobalEventStore());
  },

  getSoCraTesCommandProcessor: function (url, callback) {
    eventstore.getEventStore(url, function (err, eventStore) {
      if (err) { return callback(err); }
      if (!eventStore) { eventStore = new GlobalEventStore(); }
      callback(null, new SoCraTesCommandProcessor(new SoCraTesWriteModel(eventStore)));
    });
  },

  getRegistrationReadModel: function (url, callback) {
    eventstore.getEventStore(url, function (err, eventStore) {
      if (err || eventStore === null) { return callback(err); }
      callback(null, new RegistrationReadModel(eventStore));
    });
  }
};
