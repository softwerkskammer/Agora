"use strict";

var async = require('async');
var beans = require('nconf').get('beans');
var _ = require('underscore');
var persistence = beans.get('waitinglistPersistence');
var WaitinglistEntry = beans.get('waitinglistEntry');

var toWaitinglist = function (callback, err, stateObjects) {
  if (err) { return callback(err); }
  callback(null, _.map(stateObjects, function (object) {
    return  new WaitinglistEntry(object);
  }));
};

var toWaitinglistEntry = function (callback, err, stateObject) {
  if (err) { return callback(err); }
  callback(null, new WaitinglistEntry(stateObject));
};

module.exports = {
  waitinglist: function (callback) {
    persistence.list({startUnix: 1}, async.apply(toWaitinglist, callback));
  },
  saveWaitinglistEntry: function (waitinglistEntry, callback) {
    var searchObject = {};
    searchObject._registrantId = waitinglistEntry.registrantId();
    searchObject._activityName = waitinglistEntry.activityUrl();
    searchObject._resourceName = waitinglistEntry.resourceName();
    persistence.saveValueObject(waitinglistEntry.state, searchObject, callback);
  },

  waitinglistEntry: function (searchObject, callback) {
    persistence.getByField(searchObject, async.apply(toWaitinglistEntry, callback));
  }
};

