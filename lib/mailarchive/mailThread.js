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

module.exports = function (mailHeaders) {
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

  function addLastResponseMails(mail) {
    var responseMails = responsesToMailWithId[mail.id];
    if (responseMails) {
      responseMails.forEach(function (reply) {
        if (mail.lastResponse.timeUnix <= reply.timeUnix) {
          mail.lastResponse = reply;
        }
      });
    }
  }

  function addLastResponseMailsToResponseMails(referencedMailId) {
    if (referencedMailId === undefined) {
      referencedMailId = null;
    }

    var mails = responsesToMailWithId[referencedMailId];
    if (mails) {
      mails.forEach(function (mail) {
        if (mail.lastResponse === undefined) {
          mail.lastResponse = mail;
          addLastResponseMailsToResponseMails(mail.id);
          addLastResponseMails(mail);
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

  function sortOnTimeAscending(mail1, mail2) {
    return mail1.timeUnix - mail2.timeUnix;
  }

  function sortOnLastResponseTimeDescending(mail1, mail2) {
    return mail2.lastResponse.timeUnix - mail1.lastResponse.timeUnix;
  }

  function pushMailsToThread(replyTo) {
    var replyToId = mailId(replyTo);
    var mails = responsesToMailWithId[replyToId];
    var onThreadRoot = replyTo === null;
    if (mails) {
      if (onThreadRoot) {
        mails.sort(sortOnLastResponseTimeDescending);
      }
      else {
        mails.sort(sortOnTimeAscending);
      }
      mails.forEach(function (mail) {
        if (onThreadRoot) {
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
  addLastResponseMailsToResponseMails();
  var mailThread = [];
  pushMailsToThread(null);
  return mailThread;
};


