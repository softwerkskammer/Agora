'use strict';

var async = require('async');
var beans = require('simple-configure').get('beans');
var moment = require('moment-timezone');

var persistence = beans.get('activityresultsPersistence');
var galleryService = beans.get('galleryService');
var ActivityResult = beans.get('activityresult');

function load(activityResultName, callback) {
  persistence.getById(activityResultName, function (err, data) {
    if (err || !data) { return callback(err); }
    callback(null, new ActivityResult(data));
  });
}

module.exports = {
  getActivityResultByName: load,

  addPhotoToActivityResult: function (activityResultName, image, memberId, callback) {
    async.waterfall([
      function (cb) { galleryService.storeImage(image.path, cb); },
      function (imageUri, cb) {
        galleryService.getMetadataForImage(imageUri, function (err, metadata) { cb(err, metadata, imageUri); });
      },
      function (metadata, imageUri, cb) {
        load(activityResultName, function (err, activityResult) {
          /* eslint camelcase: 0 */
          if (err) { return cb(err); }
          var date = new Date();
          if (metadata && metadata.exif) {
            date = metadata.exif.dateTime || metadata.exif.dateTimeOriginal || metadata.exif.dateTimeDigitized || new Date();
          }
          activityResult.addPhoto({
            id: imageUri,
            timestamp: moment.min(moment(), moment(date)).toDate(),
            uploaded_by: memberId
          });
          persistence.save(activityResult.state, function (err1) { cb(err1, imageUri); });
        });
      }
    ], callback);

  },

  updatePhotoOfActivityResult: function (activityResultName, photoId, data, accessrights, callback) {
    load(activityResultName, function (err, activityResult) {
      if (err || !activityResult) { return callback(err); }
      var photo = activityResult.getPhotoById(photoId);
      if (!photo) { return callback(err); }
      if (accessrights.canEditPhoto(photo)) {
        activityResult.updatePhotoById(photoId, data);
        return persistence.save(activityResult.state, function (err1) { callback(err1); });
      }
      callback();
    });
  },

  deletePhotoOfActivityResult: function (activityResultName, photoId, callback) {
    load(activityResultName, function (err, activityResult) {
      if (err) { callback(err); }
      activityResult.deletePhotoById(photoId);
      persistence.save(activityResult.state, function (err1) {
        if (err1) { callback(err1); }
        galleryService.deleteImage(photoId, callback);
      });
    });
  }
};
