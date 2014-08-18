'use strict';
var _ = require('lodash');

function ActivityResult(data) {
  if (!data.photos) { data.photos = []; }
  if (!data.tags) { data.tags = []; }
  this.state = data;
}

ActivityResult.prototype.id = function () {
  return this.state.id;
};

ActivityResult.prototype.created_by = function () {
  return this.state.created_by;
};

ActivityResult.prototype.photos = function () {
  return this.state.photos;
};

ActivityResult.prototype.tags = function () {
  return this.state.tags;
};

ActivityResult.prototype.getPhotoById = function (id) {
  return _.find(this.photos(), { id: id });
};

ActivityResult.prototype.updatePhotoById = function (id, data) {
  _.assign(this.getPhotoById(id), data);
};

ActivityResult.prototype.addPhoto = function (photo) {
  this.photos().push(photo);
};

ActivityResult.prototype.getDistinctPresentTags = function () {
  return _(this.photos()).pluck('tags').flatten().uniq().compact().value();
};

ActivityResult.prototype.uriForPhoto = function (id) {
  var photo = this.getPhotoById(id);
  return photo.uri || '/gallery/' + photo.id;
};

module.exports = ActivityResult;
