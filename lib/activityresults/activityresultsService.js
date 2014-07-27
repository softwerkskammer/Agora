'use strict';
var logger = require('winston').loggers.get('application');
var beans = require('nconf').get('beans');

var persistence = beans.get('activityresultsPersistence');
var ActivityResult = beans.get('activityresult');

module.exports = {
  getActivityResultByName: function (activityResultName, callback) {
    persistence.getById(activityResultName, function (err, data) {
      if (err) {
        return callback(err, null);
      }

      callback(null, new ActivityResult(data));
    });
  },

  addPhotoToActivityResult: function (activityResultName, photo, callback) {
    this.getActivityResultByName(activityResultName, function (err, activityResult) {
      activityResult.photos = activityResult.photos || [];
      activityResult.photos.push(photo);
      persistence.save(activityResult, callback);
    });
  },

  updatePhotoOfActivityResult: function (activityResultName, photoId, data, callback) {
    this.getActivityResultByName(activityResultName, function (err, activityResult) {
      activityResult.updatePhotoById(photoId, data);
      persistence.save(activityResult, callback);
    });
  }
};
