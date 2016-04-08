'use strict';
var _ = require('lodash');
var moment = require('moment-timezone');

function Photo(data) {
  this.state = data || {};
}

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

Photo.prototype.uploadedBy = function () {
  return this.state.uploaded_by;
};

Photo.prototype.time = function () {
  return moment(this.state.timestamp);
};

function ActivityResult(data) {
  if (!data.photos) { data.photos = []; }
  if (!data.tags) { data.tags = []; }
  this.state = data;
}

ActivityResult.prototype.id = function () {
  return this.state.id;
};

ActivityResult.prototype.photos = function () {
  return _.map(this.state.photos, function (photo) {
    return new Photo(photo);
  });
};

ActivityResult.prototype.tags = function () {
  return this.state.tags;
};

ActivityResult.prototype.getPhotoById = function (id) {
  return _.find(this.photos(), function (photo) {
    return photo.id() === id;
  });
};

ActivityResult.prototype.updatePhotoById = function (id, data) {
  _.assign(this.getPhotoById(id).state, data);
};

ActivityResult.prototype.deletePhotoById = function (id) {
  _.remove(this.state.photos, {id: id});
};

ActivityResult.prototype.addPhoto = function (photo) {
  this.state.photos.push(photo);
};

ActivityResult.prototype.getDistinctPresentTags = function () {
  return _(this.state.photos).map('tags').flatten().uniq().compact().value();
};

ActivityResult.prototype.photosByDay = function () {
  var groupedByDay = _(this.photos()).sortBy(function (photo) {
    return photo.time();
  }).groupBy(function (photo) {
    return photo.time().startOf('day').valueOf();
  }).value();

  return _.transform(groupedByDay, function (result, photosOfDay, currentDayAsUnix) {
    result.push({
      day: moment(parseInt(currentDayAsUnix, 10)),
      photosByTag: _.groupBy(photosOfDay, function groupByFirstTag(photo) {
        return photo.tags()[0] || 'Everywhere';
      })
    });
  }, []).reverse();

};

module.exports = ActivityResult;
