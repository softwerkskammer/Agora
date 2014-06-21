'use strict';

var ActivityResult = function ActivityResult(data) {
  if (data) {
    this.id = data.id;
    this.photos = data.photos;
  }
};

module.exports = ActivityResult;