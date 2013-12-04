"use strict";

var async = require('async');
var beans = require('nconf').get('beans');
var persistence = beans.get('waitinglistPersistence');
var WaitinglistEntry = beans.get('waitinglistEntry');


var toWaitinglistEntry = function (callback, err, stateObject) {
  if (err) { return callback(err); }
  callback(null, new WaitinglistEntry(stateObject));
};

module.exports = {
  saveWaitinglistEntry: function (waitinglistEntry, callback) {
    var searchObject = {
      _registrantId: waitinglistEntry.registrantId(),
      _activityId: waitinglistEntry.activityId(),
      _resourceName: waitinglistEntry.resourceName()
    };
    persistence.saveValueObject(waitinglistEntry.state, searchObject, callback);
  },

  waitinglistEntry: function (registrantId, activityId, resourceName, callback) {
    var searchObject = {
      _registrantId: registrantId,
      _activityId: activityId,
      _resourceName: resourceName
    };
    persistence.getByField(searchObject, async.apply(toWaitinglistEntry, callback));
  }
};

