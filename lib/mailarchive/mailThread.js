"use strict";

var winston = require('winston');
var logger = winston.loggers.get('application');
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

function findLast(array, test) {
  if (!array) {
    return undefined;
  }
  var i = array.length;
  while (i--) {
    if (test(array[i])) {return array[i]; }
  }
  return undefined;
}

module.exports = function (mailHeaders, sort) {
  var knownMailIDs = {};
  var responsesToMailWithId = {};

  function registerReply(mail) {
    var lastReferencedMailId = findLast(mail.references, function (id) {
      return id in knownMailIDs;
    });
    if (lastReferencedMailId === undefined) {
      lastReferencedMailId = null;
    }
    fieldHelpers.pushIntoProperty(responsesToMailWithId, lastReferencedMailId, mail);
  }

  function addLastResponseTimesFromResponseMails(mail) {
    var responseMails = responsesToMailWithId[mail.id];
    if (responseMails) {
      responseMails.forEach(function (reply) {
        mail.lastResponseTimeUnix = Math.max(mail.lastResponseTimeUnix, reply.lastResponseTimeUnix);
      });
    }
  }

  function addLastResponseTimesToResponseMails(referencedMailId) {
    if (referencedMailId === undefined) {
      referencedMailId = null;
    }

    var mails = responsesToMailWithId[referencedMailId];
    if (mails) {
      mails.forEach(function (mail) {
        if (mail.lastResponseTimeUnix === undefined) {
          mail.lastResponseTimeUnix = mail.timeUnix;
          addLastResponseTimesToResponseMails(mail.id);
          addLastResponseTimesFromResponseMails(mail);
        }
        else {
          logger.error('self referencing mail with id "' + mail.id);
        }
      });
    }
  }

  function mailId(mail) {
    if (mail != null) {
      return mail.id;
    }
    return null;
  }

  function addResponseMail(mail, responseMail) {
    fieldHelpers.pushIntoProperty(mail, "responses", responseMail);
  }

  function pushMailsToThread(replyTo) {
    var replyToId = mailId(replyTo);
    var mails = responsesToMailWithId[replyToId];
    if (mails) {
      mails.sort(sort);
      mails.forEach(function (mail) {
        if (replyTo === null) {
          mailThread.push(mail);
        }
        else {
          addResponseMail(replyTo, mail);
        }
        pushMailsToThread(mail);
      });
    }
  }

  responsesToMailWithId[null] = [];
  mailHeaders.forEach(function (mail) { knownMailIDs[mail.id] = true; });
  mailHeaders.forEach(registerReply);
  addLastResponseTimesToResponseMails();
  var mailThread = [];
  pushMailsToThread(null);
  return mailThread;
};


