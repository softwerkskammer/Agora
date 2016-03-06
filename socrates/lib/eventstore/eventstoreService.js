'use strict';

var beans = require('simple-configure').get('beans');
var eventstore = beans.get('eventstore');

module.exports = {
  isValidUrl: function (url, callback) {
    eventstore.getEventStore(url, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  }
};
