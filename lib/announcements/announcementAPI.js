"use strict";

module.exports = function (conf) {

  var store = require('./announcementstore')(conf);

  return {
    getAnnouncement: function (idValue, callback) {
      store.getAnnouncementForId(idValue, callback);
    },

    allAnnouncements: function (callback) {
      store.allAnnouncements(callback);
    },

    allActiveAnnouncements: function (date, callback) {
      store.activeAnnouncements(date, callback);
    },

    saveAnnouncement: function (news, callback) {
      if (news.isValid()) {
        store.saveAnnouncement(news, function (err) {
          if (err) {
            return callback(err);
          }
        });
      }
      callback(null, news);
    }
  };
};

