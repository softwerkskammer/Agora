"use strict";

var announcementstore;

module.exports = function (conf) {
  if (!announcementstore) {
    var persistence = require('../persistence/persistence')('announcementstore', conf);
    var async = require('async');
    var Announcement = require('./announcement');

    var toAnnouncement = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      if (result) {
        return callback(null, new Announcement().fromObject(result));
      }
      callback(null, null);
    };

    var toAnnouncements = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      async.map(result, function (each, cb) {
        cb(null, new Announcement().fromObject(each));
      }, callback);
    };

    announcementstore = {
      allAnnouncements: function (callback) {
        persistence.list(async.apply(toAnnouncements, callback));
      },
      getAnnouncementForId: function (id, callback) {
        persistence.getById(id, async.apply(toAnnouncement, callback));
      },
      saveAnnouncement: function (announcement, callback) {
        persistence.save(announcement, callback);
      }
    };
  }
  return announcementstore;

};