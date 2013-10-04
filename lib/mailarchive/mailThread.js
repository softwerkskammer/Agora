"use strict";

var _ = require('underscore');
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

module.exports = function (mailHeaders) {
  var knownMailIDs = {};
  var responsesToMailWithId = {};

  function registerReply(mail) {
    var lastReferencedMailId = _.last(_.filter(mail.references, function (ref) {return ref in knownMailIDs; }));
    if (lastReferencedMailId === undefined) {
      lastReferencedMailId = null;
    }
    fieldHelpers.pushIntoProperty(responsesToMailWithId, lastReferencedMailId, mail);
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
    return mail2.youngestResponse().timeUnix - mail1.youngestResponse().timeUnix;
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
  var mailThread = [];
  pushMailsToThread(null);
  return mailThread;
};


