'use strict';

const beans = require('simple-configure').get('beans');
const R = require('ramda');
const misc = beans.get('misc');

const GlobalEventStore = beans.get('GlobalEventStore');
const persistence = beans.get('eventstorePersistence');

function toGlobalEventStore(callback, err, jsobject) {
  return misc.toObject(GlobalEventStore, callback, err, jsobject);
}

module.exports = {
  getEventStore: function getEventStore(url, callback) {
    persistence.getByField({url: url}, R.partial(toGlobalEventStore, [callback]));
  },

  saveEventStore: function saveEventStore(eventStore, callback) {
    persistence.save(eventStore.state, callback);
  }
};
