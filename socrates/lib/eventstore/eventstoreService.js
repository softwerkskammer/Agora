'use strict';

const R = require('ramda');

const conf = require('simple-configure');
const beans = conf.get('beans');
const cache = conf.get('cache');
const eventstore = beans.get('eventstore');
const GlobalEventStore = beans.get('GlobalEventStore');
const SoCraTesReadModel = beans.get('SoCraTesReadModel');
const SoCraTesWriteModel = beans.get('SoCraTesWriteModel');
const SoCraTesCommandProcessor = beans.get('SoCraTesCommandProcessor');
const RegistrationReadModel = beans.get('RegistrationReadModel');
const RegistrationWriteModel = beans.get('RegistrationWriteModel');
const RegistrationCommandProcessor = beans.get('RegistrationCommandProcessor');
const RoomsReadModel = beans.get('RoomsReadModel');
const RoomsWriteModel = beans.get('RoomsWriteModel');
const RoomsCommandProcessor = beans.get('RoomsCommandProcessor');

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
    const newModel = new ReadModel(eventStore.events(), argument);
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

  getSoCraTesCommandProcessor: function (url, callback) {
    getGlobalEventStoreForWriting(url, function (err, eventStore) {
      if (err) { return callback(err); }
      // when creating a new SoCraTes, we want to create a new event store for it:
      if (!eventStore) {
        eventStore = new GlobalEventStore({
          url: url,
          events: []
        });
      }
      cache.set(keyFor(url, GLOBAL_EVENT_STORE_FOR_WRITING), eventStore);
      callback(null, new SoCraTesCommandProcessor(url, new SoCraTesWriteModel()));
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
        callback(null, new RegistrationCommandProcessor(url, new RegistrationWriteModel(registrationReadModel)));
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
          callback(null, new RoomsCommandProcessor(url, new RoomsWriteModel(roomsReadModel, registrationReadModel)));
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
    events = R.flatten(events);

    const url = (commandProcessor instanceof Array) ? commandProcessor[0].url() : commandProcessor.url();

    const eventStoreFromCache = cache.get(keyFor(url, GLOBAL_EVENT_STORE_FOR_WRITING));

    eventStoreFromCache.updateEvents(events);

    // update all read models:
    R.values(cache.mget([keyFor(url, SOCRATES_READ_MODEL), keyFor(url, REGISTRATION_READ_MODEL), keyFor(url, ROOMS_READ_MODEL)])).forEach(model => model.update(events));

    eventstore.saveEventStore(eventStoreFromCache, callback);
  }
};
