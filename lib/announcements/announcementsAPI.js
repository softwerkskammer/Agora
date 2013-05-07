"use strict";
var conf = require('nconf');
var store = conf.get('beans').get('announcementstore');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

module.exports = {
  getAnnouncement: function (url, callback) {
    store.getAnnouncement(url, callback);
  },

  getAnnouncementForId: function (id, callback) {
    store.getAnnouncementForId(id, callback);
  },

  allAnnouncements: function (callback) {
    store.allAnnouncements(callback);
  },

  saveAnnouncement: function (announcement, callback) {
    if (!announcement.id || announcement.id === 'undefined') {
      announcement.id = fieldHelpers.createLinkFrom([announcement.author, announcement.title, announcement.fromDate]);
    }
    store.saveAnnouncement(announcement, function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, announcement);
    });
  },

  isValidUrl: function (url, callback) {
    var trimmedUrl = url.trim();
    if (this.isReserved(trimmedUrl)) {
      return callback(null, false);
    }
    this.getAnnouncement(trimmedUrl, function (err, result) {
      if (err) {
        return callback(err);
      }
      callback(null, result === null);
    });
  },

  isReserved: function (url) {
    return new RegExp('^edit$|^new$|^checkurl$|^submit$|^administration$|\\+', 'i').test(url);
  }
};
