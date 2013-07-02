"use strict";

var conf = require('nconf');
var async = require('async');
var _ = require('underscore');
var persistence = conf.get('beans').get('mailsPersistence');
var Mail = conf.get('beans').get('archivedMail');
var membersAPI = conf.get('beans').get('membersAPI');
var mailThread = conf.get('beans').get('mailThread');

var toMail = function (callback, err, mail) {
  if (err) { return callback(err); }
  if (mail) { return callback(null, new Mail(mail)); }
  callback(null, null);
};

var toMailList = function (callback, err, mails) {
  if (err) { return callback(err); }
  callback(null, _.map(mails, function (mail) { return new Mail(mail); }));
};

function displayedName(member) {
  return member.firstname + ' ' + member.lastname;
}

module.exports = {
  mailHeaders: function (group, callback) {

    persistence.listByFieldWithOptions(
      {group: group},
      {text: 0, html: 0},
      {timeUnix: -1},
      async.apply(toMailList, callback));
  },

  mailForId: function (id, callback) {
    persistence.getById(id, async.apply(toMail, callback));
  },

  addProfileDataForMember: function (mailHeader, callback) {
    if (!mailHeader || !mailHeader.memberId) { return callback(null); }
    membersAPI.getMemberForId(mailHeader.memberId, function (err, member) {
      if (err) { return callback(err); }
      if (member) {
        mailHeader.memberNickname = member.nickname;
        mailHeader.displayedSenderName = displayedName(member);
      }
      callback(null);
    });
  },

  senderMemberIDs: function (mailHeaders) {
    var ids = {};
    mailHeaders.forEach(function (mailHeader) {
      if (mailHeader.memberId) {
        ids[mailHeader.memberId] = null;
      }
    });
    return ids;
  },

  addProfileDataForMembers: function (mailHeaders, callback) {
    var ids = this.senderMemberIDs(mailHeaders);
    membersAPI.getMembersForIds(Object.keys(ids), function (err, members) {
      if (err) { return callback(err); }
      var ids2memberProfileData = {};
      members.forEach(function (member) {
        if (member.id && member.nickname) {
          ids2memberProfileData[member.id] = {
            nickname: member.nickname,
            displayedName: displayedName(member)
          };
        }
      });
      mailHeaders.forEach(function (mailHeader) {
        var profileData = ids2memberProfileData[mailHeader.memberId];
        if (profileData) {
          mailHeader.memberNickname = profileData.nickname;
          mailHeader.displayedSenderName = profileData.displayedName;
        }
      });
      callback(null);
    });
  },

  sortOnTimeDescending: function (mail1, mail2) {
    return mail2.timeUnix - mail1.timeUnix;
  },

  sortOnThreadModificationTimeDescending: function (mail1, mail2) {
    return mail2.lastResponseTimeUnix - mail1.lastResponseTimeUnix;
  },

  threadedMails: function (group, sort, callback) {
    this.mailHeaders(group, function (err, mailHeaders) {
      if (err) {
        callback(err);
        return;
      }
      callback(null, mailThread(mailHeaders, sort));
    });
  },

  unthreadedMails: function (group, sort, callback) {
    this.mailHeaders(group, function (err, mailHeaders) {
      if (err) {
        callback(err);
        return;
      }
      if (sort) { mailHeaders.sort(sort); }
      mailHeaders.forEach(function (mail) {mail.threadingLevel = 0; });
      callback(null, mailHeaders);
    });
  }
};
