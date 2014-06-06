'use strict';

var beans = require('nconf').get('beans');
var store = beans.get('announcementstore');
var memberstore = beans.get('memberstore');
var fieldHelpers = beans.get('fieldHelpers');

var isReserved = function (url) {
  return new RegExp('^edit$|^new$|^checkurl$|^submit$|^administration$|\\+', 'i').test(url);
};

module.exports = {
  getAuthorName: function (announcement, callback) {
    if (!announcement) {
      return callback(null);
    }
    if (!announcement.author || announcement.author === '') {
      return callback(null, 'automatisch');
    }
    memberstore.getMemberForId(announcement.author, function (err, member) {
      if (err || !member) { return callback(err); }
      callback(null, member.nickname());
    });
  },

  saveAnnouncement: function (announcement, callback) {
    if (!announcement.id || announcement.id === 'undefined') {
      announcement.id = fieldHelpers.createLinkFrom([announcement.author, announcement.title, announcement.fromUnix]);
    }
    store.saveAnnouncement(announcement, callback);
  },

  isValidUrl: function (url, callback) {
    if (isReserved(url)) { return callback(null, false); }
    store.getAnnouncement(url, function (err, result) {
      if (err) { return callback(err); }
      callback(null, result === null);
    });
  },

  isReserved: isReserved
};
