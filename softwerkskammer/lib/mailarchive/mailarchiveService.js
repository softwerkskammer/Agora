'use strict';

const beans = require('simple-configure').get('beans');
const _ = require('lodash');
const persistence = beans.get('mailsPersistence');
const Mail = beans.get('archivedMail');
const memberstore = beans.get('memberstore');
const mailThread = beans.get('mailThread');
const async = require('async');

function addProfileDataForMembers(mails, globalCallback) {
  async.map(
    mails,
    (mail, callback) => {
      memberstore.getMemberForId(mail.memberId(), (err, member) => {
        if (member) { mail.member = member; }
        callback(err, mail);
      });
    },
    globalCallback
  );
}

function mailHeadersWithProfileData(group, callback) {
  persistence.listByField({group: group}, {timeUnix: -1},
    (err, mails) => {
      if (err) { return callback(err); }
      const theHeaders = _.map(mails, mail => new Mail(mail));
      addProfileDataForMembers(theHeaders, callback);
    });
}

module.exports = {
  mailForId: function mailForId(id, callback) {
    persistence.getById(id, (err, archivedMail) => {
      if (err || !archivedMail) { return callback(err); }
      const mail = new Mail(archivedMail);
      addProfileDataForMembers([mail], err1 => {
        callback(err1, mail);
      });
    });
  },

  threadedMails: function threadedMails(group, callback) {
    mailHeadersWithProfileData(group, (err, mailHeaders) => {
      if (err) { return callback(err); }
      callback(null, mailThread(mailHeaders));
    });
  },

  unthreadedMails: function unthreadedMails(group, callback) {
    mailHeadersWithProfileData(group, (err, mailHeaders) => {
      if (err) { return callback(err); }
      callback(null, mailHeaders);
    });
  },

  unthreadedMailsYoungerThan: function unthreadedMailsYoungerThan(group, age, callback) {
    persistence.listByField({
      $and: [
        {group: group},
        {timeUnix: {$gt: age}}
      ]
    }, {timeUnix: -1}, (err, mails) => {
      if (err) { return callback(err); }
      callback(null, _.map(mails, mail => new Mail(mail)));
    });
  }
};
