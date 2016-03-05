'use strict';

var beans = require('simple-configure').get('beans');
var _ = require('lodash');
var misc = beans.get('misc');

var SoCraTesEventStore = beans.get('SoCraTesEventStore');
var persistence = beans.get('eventstorePersistence');

function toSoCraTesEventStore(callback, err, jsobject) {
  return misc.toObject(SoCraTesEventStore, callback, err, jsobject);
}

module.exports = {
  getEventStore: function (url, callback) {
    persistence.getByField({url: url}, _.partial(toSoCraTesEventStore, callback));
  },

  saveEventStore: function (eventStore, callback) {
    persistence.saveWithVersion(eventStore.state, callback);
  }
};
