"use strict";

var conf = require('nconf');
var moment = require('moment');

var store = conf.get('beans').get('mailstore');

module.exports = {
  mailHeaders4groupAndMonth: function (query, callback) {
    var startTime = moment([query.year, query.month]);
    var endTime = startTime.clone().add("months", 1);
    store.mailHeaders(
      {group : query.group, timeUnix: { $gte: startTime.unix(), $lt: endTime.unix()}}, callback);
  },

  mailForId: function (id, callback) {
    store.mailForId(id, callback);
  }
};
