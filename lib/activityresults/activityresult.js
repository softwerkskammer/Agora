'use strict';
var _ = require('lodash');

function ActivityResult(data) {
  this.tags = [];
  this.photos = [];

  if (data) {
    this.id = data.id;
    this.created_by = data.created_by;
    this.photos = data.photos || [];
    this.tags = data.tags || [];
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

ActivityResult.prototype.getDistinctPresentTags = function getDistinctPresentTags() {
  return _(this.photos).pluck('tags').flatten().uniq().compact().value();
};

module.exports = ActivityResult;
