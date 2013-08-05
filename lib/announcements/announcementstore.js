"use strict";
var conf = require('nconf');
var async = require('async');
var _ = require('underscore');
var moment = require('moment-timezone');

var persistence = conf.get('beans').get('announcementsPersistence');
var Announcement = conf.get('beans').get('announcement');

var toAnnouncement = function (callback, err, result) {
  if (err) {
    return callback(err);
  }
  if (result) {
    return callback(null, new Announcement(result));
  }
  callback(null, null);
};

var toAnnouncementList = function (callback, err, announcements) {
  if (err) { return callback(err); }
  callback(null, _.map(announcements, function (announcement) { return new Announcement(announcement); }));
};

module.exports = {
  allAnnouncements: function (callback) {
    persistence.list({fromUnix: -1}, async.apply(toAnnouncementList, callback));
  },
  allAnnouncementsUntilToday: function (callback) {
    var today = moment().startOf('day').utc().unix();
    persistence.listByFieldWithOptions(
      {$or: [ { thruUnix: {$gte: today} }, {thruUnix: null },  {thruUnix: '' } ] },
      {text: 0, html: 0},
      {fromUnix: -1},
      async.apply(toAnnouncementList, callback));
  },
  getAnnouncementForId: function (id, callback) {
    persistence.getById(id, async.apply(toAnnouncement, callback));
  },
  getAnnouncement: function (url, callback) {
    persistence.getByField(
      {url: url},
      async.apply(
        toAnnouncement,
        callback)
    );
  },
  saveAnnouncement: function (announcement, callback) {
    persistence.save(announcement, callback);
  }
};
