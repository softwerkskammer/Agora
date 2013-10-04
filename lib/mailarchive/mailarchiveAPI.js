"use strict";

var beans = require('nconf').get('beans');
var _ = require('underscore');
var persistence = beans.get('mailsPersistence');
var Mail = beans.get('archivedMail');
var membersAPI = beans.get('membersAPI');
var mailThread = beans.get('mailThread');
var async = require('async');

function sortOnTimeDescending(mail1, mail2) {
  return mail2.timeUnix - mail1.timeUnix;
}

function sortOnLastResponseTimeDescending(mail1, mail2) {
  return mail2.lastResponse.timeUnix - mail1.lastResponse.timeUnix;
}

function addProfileDataForMembers(mailHeaders, callback) {
  async.map(mailHeaders,
    function (header, callback) {
      membersAPI.getMemberForId(header.memberId(), function (err, member) {
        if (member) { header.member = member; }
        callback(err, header);
      });
    },
    function (err, headers) {
      if (err) {return callback(err); }
      callback(null, headers);
    }
  );
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
