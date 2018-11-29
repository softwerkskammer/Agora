'use strict';
const R = require('ramda');
const {DateTime} = require('luxon');

const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');

class Photo {
  constructor(data) { this.state = data || {}; }

  id() { return this.state.id; }

  tags() { return this.state.tags || []; }

  title() { return this.state.title; }

  uri() { return this.state.uri || '/gallery/' + this.id(); }

  uploadedBy() { return this.state.uploaded_by; }

  time() { return DateTime.fromJSDate(this.state.timestamp); }

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
    const onlyUniqValidEntries = R.compose(misc.compact, R.uniq, R.flatten);
    return onlyUniqValidEntries(this.state.photos.map(photo => photo.tags));
  }

  photosByDay() {
    const result = [];
    const groupedByDay = R.groupBy(photo => photo.time().set({hours: 0, minutes: 0, seconds: 0}).valueOf(), R.sortBy(photo => photo.time(), this.photos()));
    R.keys(groupedByDay).forEach(key => {
      result.unshift({
        day: DateTime.fromMillis(parseInt(key, 10)),
        photosByTag: R.groupBy(photo => { return photo.tags()[0] || 'Everywhere'; }, groupedByDay[key])
      });
    });
    return result;
  }

}

module.exports = ActivityResult;
