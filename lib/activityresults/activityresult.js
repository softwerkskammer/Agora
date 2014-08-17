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

ActivityResult.prototype.getPhotoById = function (id) {
  return _.find(this.photos, function (photo) {
    return photo.id === id;
  });
};

ActivityResult.prototype.updatePhotoById = function (id, data) {
  _.assign(this.getPhotoById(id), data);
};

ActivityResult.prototype.getDistinctPresentTags = function () {
  return _(this.photos).pluck('tags').flatten().uniq().compact().value();
};

ActivityResult.prototype.uriForPhoto = function (id) {
  var photo = this.getPhotoById(id);
  return photo.uri || '/gallery/' + photo.id;
};

module.exports = ActivityResult;
