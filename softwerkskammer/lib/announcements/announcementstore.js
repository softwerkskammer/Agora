'use strict';
var conf = require('nconf');
var _ = require('lodash');
var moment = require('moment-timezone');

var beans = require('nconf').get('beans');
var persistence = beans.get('announcementsPersistence');
var Announcement = beans.get('announcement');
var misc = beans.get('misc');

var toAnnouncement = _.partial(misc.toObject, Announcement);
var toAnnouncementList = _.partial(misc.toObjectList, Announcement);

module.exports = {
  allAnnouncements: function (callback) {
    persistence.list({fromUnix: -1}, _.partial(toAnnouncementList, callback));
  },
  allAnnouncementsUntilToday: function (callback) {
    var today = moment().startOf('day').utc().unix();
    persistence.listByFieldWithOptions(
      {$or: [
        { thruUnix: {$gte: today} },
        {thruUnix: null },
        {thruUnix: '' }
      ] },
      {text: 0, html: 0},
      {fromUnix: -1},
      _.partial(toAnnouncementList, callback)
    );
  },
  getAnnouncementForId: function (id, callback) {
    persistence.getById(id, _.partial(toAnnouncement, callback));
  },
  getAnnouncement: function (url, callback) {
    persistence.getByField(
      {url: url},
      _.partial(
        toAnnouncement,
        callback
      )
    );
  },
  saveAnnouncement: function (announcement, callback) {
    persistence.save(announcement, callback);
  }
};
