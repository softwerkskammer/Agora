'use strict';

const R = require('ramda');

module.exports = function mailThread(mailHeaders) {
  const threads = [];
  const knownMails = {};//_.keyBy(mailHeaders, 'id');
  mailHeaders.forEach(mail => {knownMails[mail.id] = mail;});

  function knownRefs(references) {
    return (references || []).filter(ref => knownMails[ref]);
  }

  mailHeaders.forEach(function (mail) {
    const lastParentMailId = R.last(knownRefs(mail.references));
    (lastParentMailId ? knownMails[lastParentMailId].responses : threads).push(mail);
  });

  return threads.sort((mail1, mail2) => mail2.youngestResponse().timeUnix - mail1.youngestResponse().timeUnix);
};


