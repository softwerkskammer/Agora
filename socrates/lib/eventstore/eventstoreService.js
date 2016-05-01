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

function getReadModel(url, key, ReadModel, callback) {
  const cacheKey = keyFor(url, key);
  var cachedModel = cache.get(cacheKey);
  if (cachedModel) {
    return callback(null, cachedModel);
  }
  eventstore.getEventStore(url, function (err, eventStore) {
    // for the read models, there must be an eventstore already:
    if (err || !eventStore) { return callback(err); }
    const newModel = new ReadModel(eventStore);
    var cachedModel2 = cache.get(cacheKey);
    if (cachedModel2) {
      return callback(null, cachedModel2);
    }
    cache.set(cacheKey, newModel);
    callback(null, newModel);
  });
}

function getReadModelWithArg(url, key, ReadModel, argument, callback) {
  const cacheKey = keyFor(url, key);
  var cachedModel = cache.get(cacheKey);
  if (cachedModel) {
    return callback(null, cachedModel);
  }
  eventstore.getEventStore(url, function (err, eventStore) {
    // for the read models, there must be an eventstore already:
    if (err || !eventStore) { return callback(err); }
    const newModel = new ReadModel(eventStore, argument);
    var cachedModel2 = cache.get(cacheKey);
    if (cachedModel2) {
      return callback(null, cachedModel2);
    }
    cache.set(cacheKey, newModel);
    callback(null, newModel);
  });
}

function getGlobalEventStoreForWriting(url, callback) {
  const cacheKey = keyFor(url, GLOBAL_EVENT_STORE_FOR_WRITING);
  const cachedStore = cache.get(cacheKey);
  if (cachedStore) {
    return callback(null, cachedStore);
  }

  eventstore.getEventStore(url, function (err, eventStore) {
    if (err || !eventStore) { return callback(err); }
    const cachedStore2 = cache.get(cacheKey);
    if (cachedStore2) {
      return callback(null, cachedStore2);
    }
    cache.set(cacheKey, eventStore);
    callback(null, eventStore);
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
    getGlobalEventStoreForWriting(url, function (err, eventStore) {
      if (err) { return callback(err); }
      // when creating a new SoCraTes, we want to create a new event store for it:
      if (!eventStore) {
        eventStore = new GlobalEventStore({
          url: url,
          socratesEvents: [],
          registrationEvents: [],
          roomsEvents: []
        });
      }
      cache.set(keyFor(url, GLOBAL_EVENT_STORE_FOR_WRITING), eventStore);
      callback(null, new SoCraTesCommandProcessor(new SoCraTesWriteModel(eventStore)));
    });
  },

  getRegistrationReadModel: function (url, callback) {
    this.getSoCraTesReadModel(url, function (err, soCraTesReadModel) {
      return getReadModelWithArg(url, REGISTRATION_READ_MODEL, RegistrationReadModel, soCraTesReadModel, callback);
    });
  },

  getRegistrationCommandProcessor: function (url, callback) {
    var self = this;
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
    var self = this;
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
      // sometimes we need to update several parts of the event store
      commandProcessor.map((processor, index) => processor.updateEventStore(events[index]));
      eventStore = commandProcessor[0].eventStore();
      events = R.flatten(events);
    } else {
      commandProcessor.updateEventStore(events);
      eventStore = commandProcessor.eventStore();
    }

    const url = eventStore.state.url;

    // update all read models:
    R.values(cache.mget([keyFor(url, SOCRATES_READ_MODEL), keyFor(url, REGISTRATION_READ_MODEL), keyFor(url, ROOMS_READ_MODEL)])).forEach(model => model.update(events));

    eventstore.saveEventStore(eventStore, callback);
  }
};
