"use strict";
var conf = require('nconf');

var store = conf.get('beans').get('announcementstore');
var membersAPI = conf.get('beans').get('membersAPI');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

module.exports = {
  getAnnouncement: function (url, callback) {
    store.getAnnouncement(url, callback);
  },

  getAnnouncementForId: function (id, callback) {
    store.getAnnouncementForId(id, callback);
  },

  getAuthorName: function (announcement, callback) {
    if (!announcement) {
      return callback(null);
    }
    if (!announcement.author || announcement.author === '') {
      announcement.authorname = 'automatisch';
      return callback(null);
    }
    membersAPI.getMemberForId(announcement.author, function (err, member) {
      if (err) {
        return callback(err);
      }
      if (member) {
        announcement.authorname = member.nickname;
      }
      callback(null);
    });
  },

  allAnnouncements: function (callback) {
    store.allAnnouncements(callback);
  },

  allAnnouncementsUntilToday: function (callback) {
    store.allAnnouncementsUntilToday(callback);
  },

  saveAnnouncement: function (announcement, callback) {
    if (!announcement.id || announcement.id === 'undefined') {
      announcement.id = fieldHelpers.createLinkFrom([announcement.author, announcement.title, announcement.fromUnix]);
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
