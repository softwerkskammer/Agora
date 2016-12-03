'use strict';

const async = require('async');
const beans = require('simple-configure').get('beans');
const moment = require('moment-timezone');

const persistence = beans.get('activityresultsPersistence');
const galleryService = beans.get('galleryService');
const ActivityResult = beans.get('activityresult');

function load(activityResultName, callback) {
  persistence.getById(activityResultName, (err, data) => {
    if (err || !data) { return callback(err); }
    callback(null, new ActivityResult(data));
  });
}

module.exports = {
  getActivityResultByName: load,

  addPhotoToActivityResult: function addPhotoToActivityResult(activityResultName, image, memberId, callback) {
    async.waterfall([
      cb => galleryService.storeImage(image.path, cb),
      (imageUri, cb) => galleryService.getMetadataForImage(imageUri, (err, metadata) => cb(err, metadata, imageUri)),
      (metadata, imageUri, cb) => {
        load(activityResultName, (err, activityResult) => {
          /* eslint camelcase: 0 */
          if (err) { return cb(err); }
          let date = new Date();
          if (metadata && metadata.exif) {
            date = metadata.exif.dateTime || metadata.exif.dateTimeOriginal || metadata.exif.dateTimeDigitized || new Date();
          }
          activityResult.addPhoto({
            id: imageUri,
            timestamp: moment.min(moment(), moment(date)).toDate(),
            uploaded_by: memberId
          });
          persistence.save(activityResult.state, err1 => cb(err1, imageUri));
        });
      }
    ], callback);
  },

  updatePhotoOfActivityResult: function updatePhotoOfActivityResult(activityResultName, photoId, data, accessrights, callback) {
    load(activityResultName, (err, activityResult) => {
      if (err || !activityResult) { return callback(err); }
      let photo = activityResult.getPhotoById(photoId);
      if (!photo) { return callback(err); }
      if (accessrights.canEditPhoto(photo)) {
        activityResult.updatePhotoById(photoId, data);
        return persistence.save(activityResult.state, err1 => callback(err1));
      }
      callback();
    });
  },

  deletePhotoOfActivityResult: function deletePhotoOfActivityResult(activityResultName, photoId, callback) {
    load(activityResultName, (err, activityResult) => {
      if (err) { callback(err); }
      activityResult.deletePhotoById(photoId);
      persistence.save(activityResult.state, err1 => {
        if (err1) { callback(err1); }
        galleryService.deleteImage(photoId, callback);
      });
    });
  }
};
