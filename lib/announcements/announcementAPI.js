"use strict";

module.exports = function (conf) {

  var store = require('./announcementstore')(conf);

  return {
    getAnnouncement: function (idValue, callback) {
      store.getAnnouncements(idValue, callback);
    },

    allAnnouncements: function (callback) {
      store.allNews(callback);
    },

    allActiveAnnouncements: function (date, callback) {
      store.activeAnnouncements(date, callback);
    },

    getAnnouncementsForId: function (id, callback) {
      store.getAnnouncementsForId(id, callback);
    },

    saveAnnouncements: function (news, callback) {
      if (news.isValid()) {
        store.saveAnnouncements(news, function (err) {
          if (err) {
            return callback(err);
          }
        });
      }
      callback(null, news);
    }
  };
};

