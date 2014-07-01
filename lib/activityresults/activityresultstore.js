/*global emit */
'use strict';

var beans = require('nconf').get('beans');
var _ = require('lodash');
var misc = beans.get('misc');

var persistence = beans.get('activityresultsPersistence');

module.exports = {
  getActivityResultById: function (id, callback) {
    persistence.getById(id, function (err, object) {
      callback(err, object);
    });
  }
};
