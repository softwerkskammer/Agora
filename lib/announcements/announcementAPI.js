"use strict";

var store = require('./announcementstore');
//var validation = require('../commons/validation');
//var fieldHelpers = require('../commons/fieldHelpers');
//var moment = require('moment');

module.exports = {
  getAnnouncement: function (url, callback) {
    store.getAnnouncement(url, callback);
  },

  allAnnouncements: function (callback) {
    store.allAnnouncements(callback);
  },

//  allActiveAnnouncements: function (date, callback) {
//    store.activeAnnouncements(date, callback);
//  },

  saveAnnouncement: function (announcement, callback) {
    if (announcement.isValid()) {
      store.saveAnnouncement(announcement, function (err) {
        if (err) {
          return callback(err);
        }
      });
    }
    callback(null, announcement);
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
    return new RegExp('^edit$|^new$|^checkurl$|^submit$|^administration$|\\W+', 'i').test(url);
  }
};

