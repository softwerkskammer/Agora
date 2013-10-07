"use strict";

var beans = require('nconf').get('beans');
var _ = require('underscore');
var persistence = beans.get('mailsPersistence');
var Mail = beans.get('archivedMail');
var membersAPI = beans.get('membersAPI');
var mailThread = beans.get('mailThread');
var async = require('async');

function addProfileDataForMembers(mails, globalCallback) {
  async.map(mails,
    function (mail, callback) {
      membersAPI.getMemberForId(mail.memberId(), function (err, member) {
        if (member) { mail.member = member; }
        callback(err, mail);
      });
    },
    globalCallback
  );
}

function mailHeadersWithProfileData(group, callback) {
  persistence.listByField({group: group}, {timeUnix: -1},
    function (err, mails) {
      if (err) { return callback(err); }
      var theHeaders = _.map(mails, function (mail) { return new Mail(mail); });
      addProfileDataForMembers(theHeaders, callback);
    });
}

module.exports = {
  mailForId: function (id, callback) {
    persistence.getById(id, function (err, archivedMail) {
      if (err || !archivedMail) { return callback(err); }
      var mail = new Mail(archivedMail);
      addProfileDataForMembers([mail], function (err) {
        if (err) { return callback(err); }
        callback(null, mail);
      });
    });
  },

  threadedMails: function (group, callback) {
    mailHeadersWithProfileData(group, function (err, mailHeaders) {
      if (err) { return callback(err); }
      callback(null, mailThread(mailHeaders));
    });
  },

  unthreadedMails: function (group, callback) {
    mailHeadersWithProfileData(group, function (err, mailHeaders) {
      if (err) { return callback(err); }
      callback(null, mailHeaders);
    });
  }
};
