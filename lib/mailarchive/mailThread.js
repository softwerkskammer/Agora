"use strict";

var _ = require('underscore');

module.exports = function (mailHeaders) {
  var topLevelMails = [];

  function registerReply(mail) {
    var knownMails = _.indexBy(mailHeaders, 'id');
    var lastParentMailId = _.last(_.filter(mail.references, function (ref) { return ref in knownMails; }));
    if (lastParentMailId !== undefined) {
      return knownMails[lastParentMailId].responses.push(mail);
    }
    topLevelMails.push(mail);
  }

  function descendingByLatestMail(mail1, mail2) {
    return mail2.youngestResponse().timeUnix - mail1.youngestResponse().timeUnix;
  }

  mailHeaders.forEach(registerReply);
  topLevelMails.sort(descendingByLatestMail);
  return topLevelMails;
};


