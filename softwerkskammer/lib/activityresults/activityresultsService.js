'use strict';
var beans = require('nconf').get('beans');
var moment = require('moment-timezone');

var persistence = beans.get('activityresultsPersistence');
var ActivityResult = beans.get('activityresult');

module.exports = {
  getActivityResultByName: function (activityResultName, callback) {
    persistence.getById(activityResultName, function (err, data) {
      if (err || !data) { return callback(err); }

      callback(null, new ActivityResult(data));
    });
  },

  addPhotoToActivityResult: function (activityResultName, metadata, imageUri, memberId, callback) {
    var date;
    if (metadata && metadata.exif) {
      date = metadata.exif.dateTime || metadata.exif.dateTimeOriginal || metadata.exif.dateTimeDigitized || new Date();
    } else {
      date = new Date();
    }
    date = moment.min(moment(), moment(date)).toDate();

    var photo = {
      id: imageUri,
      timestamp: date,
      uploaded_by: memberId
    };

    this.getActivityResultByName(activityResultName, function (err, activityResult) {
      activityResult.addPhoto(photo);
      persistence.save(activityResult.state, callback);
    });
  },

  updatePhotoOfActivityResult: function (activityResult, photoId, data, callback) {
    activityResult.updatePhotoById(photoId, data);
    persistence.save(activityResult.state, callback);
  }
};
