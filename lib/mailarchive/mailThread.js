"use strict";

var winston = require('winston');
var logger = winston.loggers.get('application');

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
    var responseMails = responsesToMailWithId[lastReferencedMailId];
    if (responseMails) {
      responseMails.push(mail);
    }
    else {
      responsesToMailWithId[lastReferencedMailId] = [mail];
    }
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

  function pushMailsToThread(replyToId, level) {
    var mails = responsesToMailWithId[replyToId];
    if (mails) {
      mails.sort(sort);
      mails.forEach(function (mail) {
        mail.threadingLevel = level;
        mailThread.push(mail);
        pushMailsToThread(mail.id, level + 1);
      });
    }
  }

  responsesToMailWithId[null] = [];
  mailHeaders.forEach(function (mail) { knownMailIDs[mail.id] = true; });
  mailHeaders.forEach(registerReply);
  addLastResponseTimesToResponseMails();
  var mailThread = [];
  pushMailsToThread(null, 0);
  return mailThread;
};


