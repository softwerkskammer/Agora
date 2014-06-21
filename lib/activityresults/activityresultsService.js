'use strict';
var logger = require('winston').loggers.get('application');

function ActivityResult(_id) {
  this.id = _id;
}

module.exports = {
  getActivityResultByName: function (activityResultName, callback) {
    if ('known-activity-results' === activityResultName) {
      return callback(null, new ActivityResult(activityResultName));
    }
    callback(new Error('TODO Not implemented!'));
  }
};
