'use strict';
const R = require('ramda');
const moment = require('moment-timezone');

class Photo {
  constructor(data) { this.state = data || {}; }

  id() { return this.state.id; }

  tags() { return this.state.tags || []; }

  title() { return this.state.title; }

  uri() { return this.state.uri || '/gallery/' + this.id(); }

  uploadedBy() { return this.state.uploaded_by; }

  time() { return moment(this.state.timestamp); }

  updateTitleTagsAndTimestamp(data) {
    this.state.title = data.title;
    this.state.tags = data.tags;
    this.state.timestamp = data.timestamp;
  }
}

class ActivityResult {
  constructor(data) {
    if (!data.photos) { data.photos = []; }
    if (!data.tags) { data.tags = []; }
    this.state = data;
  }

  id() { return this.state.id; }

  photos() {
    return this.state.photos.map(photo => new Photo(photo));
  }

  tags() { return this.state.tags; }

  getPhotoById(id) {
    return this.photos().find(photo => photo.id() === id);
  }

  updatePhotoById(id, data) {
    this.getPhotoById(id).updateTitleTagsAndTimestamp(data);
  }

  deletePhotoById(id) {
    this.state.photos = R.reject(photo => photo.id === id, this.state.photos);
  }

  addPhoto(photo) { this.state.photos.push(photo); }

  getDistinctPresentTags() {
    const onlyUniqValidEntries = R.compose(R.filter(x => x), R.uniq, R.flatten);
    return onlyUniqValidEntries(this.state.photos.map(photo => photo.tags));
  }

  photosByDay() {
    const result = [];
    const groupedByDay = R.groupBy(photo => photo.time().startOf('day').valueOf(), R.sortBy(photo => photo.time(), this.photos()));
    R.keys(groupedByDay).forEach(key => {
      result.unshift({
        day: moment(parseInt(key, 10)),
        photosByTag: R.groupBy(photo => { return photo.tags()[0] || 'Everywhere'; }, groupedByDay[key])
      });
    });
    return result;
  }

}

module.exports = ActivityResult;
