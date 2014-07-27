'use strict';
var logger = require('winston').loggers.get('application');
var beans = require('nconf').get('beans');

var persistence = beans.get('activityresultsPersistence');

module.exports = {
  getActivityResultByName: function (activityResultName, callback) {
    persistence.getById(activityResultName, callback);
  }
};
