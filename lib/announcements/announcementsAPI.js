"use strict";
var conf = require('nconf');
var moment = require('moment');

var store = conf.get('beans').get('announcementstore');
var validation = conf.get('beans').get('validation');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function checkAnnouncementAndSave(announcement, callback, api) {
  var errors = validation.isValidAnnouncement(announcement);
  if (errors.length !== 0) { return callback(false, errors); }
  api.saveAnnouncement(announcement, function (err, result) {
    if (err || !result) { return callback(false, []); }
    callback(true);
  });
}

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

  allAnnouncementsUntilToday: function (callback) {
    store.allAnnouncementsUntilToday(callback);
  },

  saveAnnouncement: function (announcement, callback) {
    if (!announcement.id || announcement.id === 'undefined') {
      announcement.id = fieldHelpers.createLinkFrom([announcement.author, announcement.title, announcement.fromDate]);
    }
    // Convert unix timestamp to int32 before saving -- to prevent timestamp be saved as a string, which causes serious trouble! ;)
    announcement.fromDate = parseInt(announcement.fromDate, 10);
    // Convert German date to unix timestamp before saving
    if (announcement.thruDate) {
      announcement.thruDate = moment(announcement.thruDate, 'DD.MM.YYYY').unix();
    }
    store.saveAnnouncement(announcement, function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, announcement);
    });
  },

  updateAnnouncementFieldWith: function (id, field, value, callback) {
    var api = this;
    api.getAnnouncementForId(id, function (err, announcement) {
      if (field === 'url' && announcement.url !== value) {
        api.isValidUrl(value, function (err, check) {
          if (err || !check) { return callback(false, ['Diese URL ist leider nicht verfügbar.']); }
          announcement.url = value;
          checkAnnouncementAndSave(announcement, callback, api);
        });
      } else {
        announcement[field] = value;
        checkAnnouncementAndSave(announcement, callback, api);
      }
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
