'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var misc = beans.get('misc');

var GlobalEventStore = beans.get('GlobalEventStore');
var persistence = beans.get('eventstorePersistence');

function toGlobalEventStore(callback, err, jsobject) {
  return misc.toObject(GlobalEventStore, callback, err, jsobject);
}

module.exports = {
  getEventStore: function (url, callback) {
    persistence.getByField({url: url}, _.partial(toGlobalEventStore, callback));
  },

  saveEventStore: function (eventStore, callback) {
    persistence.save(eventStore.state, callback);
  }
};
