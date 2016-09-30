'use strict';

const R = require('ramda');

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
const GLOBAL_EVENT_STORE_FOR_WRITING = 'globalEventStoreForWriting';

function keyFor(url, key) {
  return url + '_' + key;
}

function getGlobalEventStoreForWriting(url, callback) {
  const cacheKey = keyFor(url, GLOBAL_EVENT_STORE_FOR_WRITING);
  const cachedStore = cache.get(cacheKey);
  if (cachedStore) {
    return callback(null, cachedStore);
  }

  eventstore.getEventStore(url, function (err, eventStore) {
    if (err || !eventStore) { return callback(err); }
    const cachedWhileFetching = cache.get(cacheKey);
    if (cachedWhileFetching) {
      return callback(null, cachedWhileFetching);
    }
    cache.set(cacheKey, eventStore);
    callback(null, eventStore);
  });
}

function getReadModelWithArg(url, key, ReadModel, argument, callback) {
  const cacheKey = keyFor(url, key);
  const cachedModel = cache.get(cacheKey);
  if (cachedModel) {
    return callback(null, cachedModel);
  }
  getGlobalEventStoreForWriting(url, function (err, eventStore) {
    // for the read models, there must be an eventstore already:
    if (err || !eventStore) { return callback(err); }
    const cachedWhileFetching = cache.get(cacheKey);
    if (cachedWhileFetching) {
      return callback(null, cachedWhileFetching);
    }
    const newModel = new ReadModel(eventStore, argument);
    cache.set(cacheKey, newModel);
    callback(null, newModel);
  });
}

function getReadModel(url, key, ReadModel, callback) {
  return getReadModelWithArg(url, key, ReadModel, undefined, callback);
}

module.exports = {
  // "valid" has the notion of "not yet in use"
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

  getSoCraTesCommandProcessor: function (existingUrl, newUrl, callback) {
    getGlobalEventStoreForWriting(existingUrl, function (err, eventStore) {
      if (err) { return callback(err); }
      // when creating a new SoCraTes, we want to create a new event store for it:
      if (!eventStore) {
        eventStore = new GlobalEventStore({
          url: newUrl,
          events: []
        });
      }
      cache.set(keyFor(newUrl, GLOBAL_EVENT_STORE_FOR_WRITING), eventStore);
      callback(null, new SoCraTesCommandProcessor(new SoCraTesWriteModel(eventStore)));
    });
  },

  getRegistrationReadModel: function (url, callback) {
    this.getSoCraTesReadModel(url, function (err, soCraTesReadModel) {
      return getReadModelWithArg(url, REGISTRATION_READ_MODEL, RegistrationReadModel, soCraTesReadModel, callback);
    });
  },

  getRegistrationCommandProcessor: function (url, callback) {
    const self = this;
    getGlobalEventStoreForWriting(url, function (err, eventStore) {
      // when adding a new registration, we require the event store to be already in place:
      if (err || !eventStore) { return callback(err); }
      self.getRegistrationReadModel(url, function (err1, registrationReadModel) {
        if (err1 || !registrationReadModel) { return callback(err1); }
        callback(null, new RegistrationCommandProcessor(new RegistrationWriteModel(eventStore, registrationReadModel)));
      });
    });
  },

  getRoomsCommandProcessor: function (url, callback) {
    const self = this;
    getGlobalEventStoreForWriting(url, function (err, eventStore) {
      // when adding a new rooms combination, we require the event store to be already in place:
      if (err || !eventStore) { return callback(err); }
      self.getRegistrationReadModel(url, function (err2, registrationReadModel) {
        if (err2 || !registrationReadModel) { return callback(err2); }
        self.getRoomsReadModel(url, function (err1, roomsReadModel) {
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

  saveCommandProcessor: function (commandProcessor, events, callback) {
    if (!(events instanceof Array)) {
      events = [events];
    }

    let eventStore;
    if (commandProcessor instanceof Array) {
      eventStore = commandProcessor[0].eventStore();
      events = R.flatten(events);
    } else {
      eventStore = commandProcessor.eventStore();
    }

    const url = eventStore.state.url;
    eventStore.updateEvents(events);

    // update all read models:
    R.values(cache.mget([keyFor(url, SOCRATES_READ_MODEL), keyFor(url, REGISTRATION_READ_MODEL), keyFor(url, ROOMS_READ_MODEL)])).forEach(model => model.update(events));

    eventstore.saveEventStore(eventStore, callback);
  }
};
