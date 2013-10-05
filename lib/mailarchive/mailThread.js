"use strict";

var _ = require('underscore');

module.exports = function (mailHeaders) {
  var threads = [];
  var knownMails = _.indexBy(mailHeaders, 'id');

  function knownRefs(references) {
    return _.filter(references, function (ref) { return ref in knownMails; });
  }

  mailHeaders.forEach(function (mail) {
    var lastParentMailId = _.last(knownRefs(mail.references));
    (lastParentMailId !== undefined ? knownMails[lastParentMailId].responses : threads).push(mail);
  });
  return threads.sort(function (mail1, mail2) {
    return mail2.youngestResponse().timeUnix - mail1.youngestResponse().timeUnix;
  });
};


