'use strict';
var logger = require('winston').loggers.get('application');
var beans = require('nconf').get('beans');

var store = beans.get('activityresultstore');

module.exports = {
  getActivityResultByName: function (activityResultName, callback) {
    store.getActivityResultById(activityResultName, callback);
  }
};
