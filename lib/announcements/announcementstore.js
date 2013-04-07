"use strict";

var announcementstore;

module.exports = function (conf) {
  if (!announcementstore) {
    var persistence = require('../persistence/persistence')('announcementstore', conf);
    var async = require('async');
    var Announcement = require('./announcement');

    var toAnnouncements = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      if (result) {
        return callback(null, new Announcement().fromObject(result));
      }
      callback(null, null);
    };

    var toAnnouncementsList = function (callback, err, result) {
      if (err) {
        return callback(err);
      }
      async.map(result, function (each, cb) {
        cb(null, new Announcement().fromObject(each));
      }, callback);
    };

    announcementstore = {
      allNews    : function (callback) {
        persistence.list(async.apply(toAnnouncementsList, callback));
      },
      getMemberForId: function (id, callback) {
        persistence.getById(id, async.apply(toAnnouncements, callback));
      },
      saveNews    : function (announcement, callback) {
        persistence.save(announcement, callback);
      }
    };
  }
  return announcementstore;

};