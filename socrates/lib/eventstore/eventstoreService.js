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

const SOCRATES_READ_MODEL = 'soCraTesReadModel';
const REGISTRATION_READ_MODEL = 'registrationReadModel';
const ROOMS_READ_MODEL = 'roomsReadModel';

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

function getReadModelWithArg(url, key, ReadModel, argument, callback) {
  var cachedModel = cache.get(key);
  if (cachedModel) {
    return callback(null, cachedModel);
  }
  eventstore.getEventStore(url, function (err, eventStore) {
    // for the read models, there must be an eventstore already:
    if (err || !eventStore) { return callback(err); }
    const newModel = new ReadModel(eventStore, argument);
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
    return getReadModel(url, SOCRATES_READ_MODEL, SoCraTesReadModel, callback);
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
    this.getSoCraTesReadModel(url, function (err, soCraTesReadModel) {
      return getReadModelWithArg(url, REGISTRATION_READ_MODEL, RegistrationReadModel, soCraTesReadModel, callback);
    });
  },

  getRegistrationCommandProcessor: function (url, callback) {
    // var self = this; TODO wtf?!
    eventstore.getEventStore(url, function (err, eventStore) {
      // when adding a new registration, we require the event store to be already in place:
      if (err || !eventStore) { return callback(err); }
      // self.getRegistrationReadModel(url, function (err1, registrationReadModel) {
      getReadModel(url, SOCRATES_READ_MODEL, SoCraTesReadModel, function (err0, soCraTesReadModel) {
        if (err0 || !soCraTesReadModel) { return callback(err0); }
        getReadModelWithArg(url, REGISTRATION_READ_MODEL, RegistrationReadModel, soCraTesReadModel, function (err1, registrationReadModel) {
          if (err1 || !registrationReadModel) { return callback(err1); }
          callback(null, new RegistrationCommandProcessor(new RegistrationWriteModel(eventStore, registrationReadModel)));
        });
      });
    });
  },

  getRoomsCommandProcessor: function (url, callback) {
    // var self = this; TODO wtf?!
    eventstore.getEventStore(url, function (err, eventStore) {
      // when adding a new rooms combination, we require the event store to be already in place:
      if (err || !eventStore) { return callback(err); }
        // self.getRegistrationReadModel(url, function (err2, registrationReadModel) {
        getReadModel(url, REGISTRATION_READ_MODEL, RegistrationReadModel, function (err2, registrationReadModel) {
          if (err2 || !registrationReadModel) { return callback(err2); }
          // self.getRoomsReadModel(url, function (err1, roomsReadModel) {
          getReadModelWithArg(url, ROOMS_READ_MODEL, RoomsReadModel, registrationReadModel, function (err1, roomsReadModel) {
            if (err1 || !roomsReadModel) { return callback(err1); }
          callback(null, new RoomsCommandProcessor(new RoomsWriteModel(eventStore, roomsReadModel, registrationReadModel)));
        });
      });
    });
  },

  getRoomsReadModel: function (url, callback) {
    this.getRegistrationReadModel(url, function (err, registrationReadModel) {
      return getReadModelWithArg(url, ROOMS_READ_MODEL, RoomsReadModel, registrationReadModel, callback);
    });
  },

  saveCommandProcessor: function (commandProcessor, callback) {
    eventstore.saveEventStore(commandProcessor.eventStore(), function (err) {
      if (err) {return callback(err); }
      cache.del([SOCRATES_READ_MODEL, REGISTRATION_READ_MODEL, ROOMS_READ_MODEL]);
      callback();
    });
  }
};
