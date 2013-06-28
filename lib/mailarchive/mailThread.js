"use strict";

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
  mailHeaders.forEach(function (mail) { knownMailIDs[mail.id] = true; });

  var replyToMap = {};
  replyToMap[null] = [];
  function registerReply(mail) {
    var replyToId = findLast(mail.references, function (id) {
      return id in knownMailIDs;
    });
    if (replyToId === undefined) {
      replyToId = null;
    }
    var replies = replyToMap[replyToId];
    if (replies) {
      replies.push(mail);
    }
    else {
      replyToMap[replyToId] = [mail];
    }
  }

  mailHeaders.forEach(registerReply);

  function addThreadModificationTimesToReplies(replyToId) {
    if (replyToId === undefined) {
      replyToId = null;
    }

    var mails = replyToMap[replyToId];
    if (mails) {
      mails.forEach(function (mail) {
        addThreadModificationTimesToReplies(mail.id);
        mail.threadModificationTimeUnix = mail.timeUnix;
        var replies = replyToMap[mail.id];
        if (replies) {
          replies.forEach(function (reply) {
            mail.threadModificationTimeUnix = Math.max(mail.threadModificationTimeUnix, reply.threadModificationTimeUnix);
          });
        }
      });
    }
  }

  addThreadModificationTimesToReplies();

  var mailThread = [];

  function pushMailsToThread(replyToId, level) {
    var mails = replyToMap[replyToId];
    if (mails) {
      mails.sort(sort);
      mails.forEach(function (mail) {
        mail.threadingLevel = level;
        mailThread.push(mail);
        pushMailsToThread(mail.id, level + 1);
      });
    }
  }

  pushMailsToThread(null, 0);
  return mailThread;
};


