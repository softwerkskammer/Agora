'use strict';

const conf = require('simple-configure');
var beans = conf.get('beans');
var cache = conf.get('cache');
var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var SoCraTesReadModel = beans.get('SoCraTesReadModel');
var SoCraTesWriteModel = beans.get('SoCraTesWriteModel');
var SoCraTesCommandProcessor = beans.get('SoCraTesCommandProcessor');
var RegistrationReadModel = beans.get('RegistrationReadModel');
var RegistrationWriteModel = beans.get('RegistrationWriteModel');
var RegistrationCommandProcessor = beans.get('RegistrationCommandProcessor');
var RoomsReadModel = beans.get('RoomsReadModel');
var RoomsWriteModel = beans.get('RoomsWriteModel');
var RoomsCommandProcessor = beans.get('RoomsCommandProcessor');


function getReadModel(url, key, ReadModel, callback) {
  var cachedModel = cache.get(key);
  if (cachedModel) {
    return callback(null, cachedModel);
  }
  eventstore.getEventStore(url, function (err, eventStore) {
    // for the read models, there must be an eventstore already:
    if (err || !eventStore) { return callback(err); }
    const newModel = new ReadModel(eventStore);
    cache.set(key, newModel);
    callback(null, newModel);
  });
}

module.exports = {
  isValidUrl: function (url, callback) {
    eventstore.getEventStore(url, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  getSoCraTesReadModel: function (url, callback) {
    return getReadModel(url, 'soCraTesReadModel', SoCraTesReadModel, callback);
  },

  newSoCraTesReadModel: function () {
    return new SoCraTesReadModel(new GlobalEventStore());
  },

  getSoCraTesCommandProcessor: function (url, callback) {
    eventstore.getEventStore(url, function (err, eventStore) {
      // when creating a new SoCraTes, we want to create a new event store for it:
      if (err) { return callback(err); }
      if (!eventStore) { eventStore = new GlobalEventStore(); }
      callback(null, new SoCraTesCommandProcessor(new SoCraTesWriteModel(eventStore)));
    });
  },

  getRegistrationReadModel: function (url, callback) {
    return getReadModel(url, 'registrationReadModel', RegistrationReadModel, callback);
  },

  getRegistrationCommandProcessor: function (url, callback) {
    eventstore.getEventStore(url, function (err, eventStore) {
      // when adding a new registration, we require the event store to be already in place:
      if (err || !eventStore) { return callback(err); }
      callback(null, new RegistrationCommandProcessor(new RegistrationWriteModel(eventStore)));
    });
  },

  getRoomsCommandProcessor: function (url, callback) {
    eventstore.getEventStore(url, function (err, eventStore) {
      // when adding a new rooms combination, we require the event store to be already in place:
      if (err || !eventStore) { return callback(err); }
      callback(null, new RoomsCommandProcessor(new RoomsWriteModel(eventStore)));
    });
  },

  getRoomsReadModel: function (url, callback) {
    return getReadModel(url, 'roomsReadModel', RoomsReadModel, callback);
  },

  saveCommandProcessor: function (commandProcessor, callback) {
    eventstore.saveEventStore(commandProcessor.eventStore(), callback);
  }
};
