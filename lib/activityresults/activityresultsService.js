'use strict';
var logger = require('winston').loggers.get('application');
var beans = require('nconf').get('beans');

var persistence = beans.get('activityresultsPersistence');

module.exports = {
  getActivityResultByName: function (activityResultName, callback) {
    persistence.getById(activityResultName, callback);
  },

  addPhotoToActivityResult: function (activityResultName, photo, callback) {
    this.getActivityResultByName(activityResultName, function (err, activityResult) {
      activityResult.photos = activityResult.photos || [];
      activityResult.photos.push(photo);
      persistence.save(activityResult, callback);
    });
  }
};
