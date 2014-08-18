'use strict';
var _ = require('lodash');
var moment = require('moment-timezone');

function ActivityResult(data) {
  if (!data.photos) { data.photos = []; }
  if (!data.tags) { data.tags = []; }
  this.state = data;
}

function Photo(data) {
  this.state = data;
}

ActivityResult.prototype.id = function () {
  return this.state.id;
};

ActivityResult.prototype.created_by = function () {
  return this.state.created_by;
};

ActivityResult.prototype.photos = function () {
  function createPhotoProto(photo) {
    return new Photo(photo);
  }

  return _.map(this.state.photos, createPhotoProto);
};

ActivityResult.prototype.tags = function () {
  return this.state.tags;
};

ActivityResult.prototype.getPhotoById = function (id) {
  return _.find(this.photos(), function (photo) {return photo.id() === id; });
};

ActivityResult.prototype.updatePhotoById = function (id, data) {
  _.assign(this.getPhotoById(id).state, data);
};

ActivityResult.prototype.addPhoto = function (photo) {
  this.state.photos.push(photo);
};

ActivityResult.prototype.getDistinctPresentTags = function () {
  return _(this.state.photos).pluck('tags').flatten().uniq().compact().value();
};

Photo.prototype.id = function () {
  return this.state.id;
};

Photo.prototype.tags = function () {
  return this.state.tags || [];
};

Photo.prototype.title = function () {
  return this.state.title;
};

Photo.prototype.uri = function () {
  return this.state.uri || '/gallery/' + this.id();
};

Photo.prototype.uploaded_by = function () {
  return this.state.uploaded_by;
};

Photo.prototype.time = function () {
  return moment(this.state.timestamp);
};

Photo.prototype.thumbnailInfos = function (language) {
  function shortenTitle(title) {
    if (!title) { return 'No title'; }
    return title.length > 20 ? title.substring(0, 20) + '...' : title;
  }
  return shortenTitle(this.title()) + ' ' + this.time().locale(language).format('LT');
};

module.exports = ActivityResult;
