'use strict';
var ld = require('lodash');

var ActivityResult = function ActivityResult(data) {
  var _this = this;

  if (data) {
    this.id = data.id;
    this.created_by = data.created_by;
    this.photos = data.photos;
    this.tags = data.tags;
  }

  this.getPhotoById = function getPhotoById(id) {
    return ld.find(_this.photos, function (photo) {
      return photo.id === id;
    });
  };

  this.updatePhotoById = function updatePhotoById(id, data) {
    ld.assign(_this.getPhotoById(id), data);
  };
};

module.exports = ActivityResult;
