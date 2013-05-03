"use strict";
var persistence = require('../persistence/persistence')('announcementstore');
var async = require('async');
var Announcement = require('./announcement');

var toAnnouncement = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  if (result) {
    return callback(null, new Announcement(result));
  }
  callback(null, null);
};

var toAnnouncements = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  async.map(result, function (each, cb) {
    cb(null, new Announcement(each));
  }, callback);
};

module.exports = {
  allAnnouncements: function (callback) {
    persistence.list({title: 1}, async.apply(toAnnouncements, callback));
  },
//  getAnnouncementForId: function (id, callback) {
//    persistence.getById(id, async.apply(toAnnouncement, callback));
//  },
  getAnnouncement: function (url, callback) {
    persistence.getByField({url: url}, async.apply(toAnnouncement, callback));
  },
  saveAnnouncement: function (announcement, callback) {
    persistence.save(announcement, callback);
  }
};
