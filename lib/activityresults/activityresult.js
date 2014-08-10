'use strict';
var _ = require('lodash');

function ActivityResult(data) {
  if (data) {
    this.id = data.id;
    this.created_by = data.created_by;
    this.photos = data.photos;
  }
}

ActivityResult.prototype.getPhotoById = function getPhotoById(id) {
  return _.find(this.photos, function (photo) {
    return photo.id === id;
  });
};

ActivityResult.prototype.updatePhotoById = function updatePhotoById(id, data) {
  _.assign(this.getPhotoById(id), data);
};

module.exports = ActivityResult;
