'use strict';

var _ = require('lodash');

module.exports = function (mailHeaders) {
  var threads = [];
  var knownMails = _.keyBy(mailHeaders, 'id');

  function knownRefs(references) {
    return _.filter(references, function (ref) { return knownMails[ref] !== undefined; });
  }

  mailHeaders.forEach(function (mail) {
    var lastParentMailId = _.last(knownRefs(mail.references));
    (lastParentMailId !== undefined ? knownMails[lastParentMailId].responses : threads).push(mail);
  });
  return threads.sort(function (mail1, mail2) {
    return mail2.youngestResponse().timeUnix - mail1.youngestResponse().timeUnix;
  });
};


