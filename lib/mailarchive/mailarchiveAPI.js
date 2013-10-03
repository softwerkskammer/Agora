"use strict";

var conf = require('nconf');
var _ = require('underscore');
var persistence = conf.get('beans').get('mailsPersistence');
var Mail = conf.get('beans').get('archivedMail');
var membersAPI = conf.get('beans').get('membersAPI');
var mailThread = conf.get('beans').get('mailThread');

function sortOnTimeDescending(mail1, mail2) {
  return mail2.timeUnix - mail1.timeUnix;
}

function sortOnLastResponseTimeDescending(mail1, mail2) {
  return mail2.lastResponse.timeUnix - mail1.lastResponse.timeUnix;
}

function addProfileDataForMembers(mailHeaders, callback) {
  var ids = _.map(mailHeaders, function (it) { return it ? it.memberId : null; });
  ids = _.filter(ids, function (id) { return id !== null || !id; });
  if (ids.length === 0) { return callback(null, mailHeaders); }
  membersAPI.getMembersForIds(ids, function (err, members) {
    if (err) { return callback(err); }
    var ids2memberProfileData = {};
    members.forEach(function (member) {
      if (member.id && member.nickname) {
        ids2memberProfileData[member.id] = member;
      }
    });
    mailHeaders.forEach(function (mailHeader) {
      var member = ids2memberProfileData[mailHeader.memberId];
      if (member) {
        mailHeader.memberNickname = member.nickname;
        mailHeader.displayedSenderName = member.displayName();
      }
    });
    callback(null, mailHeaders);
  });
}

function mailHeadersWithProfileData(group, callback) {
  persistence.listByFieldWithOptions({group: group}, {text: 0, html: 0}, {timeUnix: -1},
    function (err, mails) {
      if (err) { return callback(err); }
      var theHeaders = _.map(mails, function (mail) { return new Mail(mail); });
      addProfileDataForMembers(theHeaders, callback);
    });
}

module.exports = {
  mailForId: function (id, callback) {
    persistence.getById(id, function (err, archivedMail) {
      if (err) { return callback(err); }
      if (!archivedMail) { return callback(null); }
      var mail = new Mail(archivedMail);
      addProfileDataForMembers([mail], function (err) {
        if (err) { callback(err); }
        callback(null, mail);
      });
    });
  },

  threadedMails: function (group, callback) {
    mailHeadersWithProfileData(group, function (err, mailHeaders) {
      if (err) { return callback(err); }
      callback(null, mailThread(mailHeaders, sortOnLastResponseTimeDescending));
    });
  },

  unthreadedMails: function (group, callback) {
    mailHeadersWithProfileData(group, function (err, mailHeaders) {
      if (err) { return callback(err); }
      mailHeaders.sort(sortOnTimeDescending);
      mailHeaders.forEach(function (mail) {mail.threadingLevel = 0; });
      callback(null, mailHeaders);
    });
  }
};
