"use strict";
var conf = require('nconf');
var moment = require('moment');

var store = conf.get('beans').get('announcementstore');
var membersAPI = conf.get('beans').get('membersAPI');
var validation = conf.get('beans').get('validation');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function checkAnnouncementAndSave(announcement, callback, api) {
  var errors = validation.isValidAnnouncement(announcement);
  if (errors.length !== 0) {
    return callback(false, errors);
  }
  api.saveAnnouncement(announcement, function (err, result) {
    if (err || !result) {
      return callback(false, []);
    }
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

  convertDates: function (announcement, callback) {
    if (announcement.fromDate) {
      if (typeof announcement.fromDate === 'string' && moment.utc(announcement.fromDate, 'DD.MM.YYYY').isValid()) {
        announcement.fromDate = parseInt(moment.utc(announcement.fromDate, 'DD.MM.YYYY').unix(), 10);
      } else {
        announcement.fromDate = parseInt(announcement.fromDate, 10);
      }
    } else {
      announcement.fromDate = parseInt(moment.utc().unix(), 10);
    }

    if (!announcement.thruDate) {
      announcement.thruDate = null;
    } else {
      if (typeof announcement.thruDate === 'string' && moment.utc(announcement.thruDate, 'DD.MM.YYYY').isValid()) {
        announcement.thruDate = moment.utc(announcement.thruDate, 'DD.MM.YYYY').unix();
      } else {
        announcement.thruDate = null;
      }
    }
    callback(null, announcement);
  },

  saveAnnouncement: function (announcement, callback) {
    if (!announcement.id || announcement.id === 'undefined') {
      announcement.id = fieldHelpers.createLinkFrom([announcement.author, announcement.title, announcement.fromDate]);
    }
    this.convertDates(announcement, function (err) {
      if (err) {
        return callback(err);
      }
    });
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
          if (err || !check) {
            return callback(false, ['Diese URL ist leider nicht verfügbar.']);
          }
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
