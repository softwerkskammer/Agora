'use strict';

var async = require('async');

var conf = require('simple-configure');

var beans = conf.get('beans');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var activityParticipantService = beans.get('activityParticipantService');
var statusmessage = beans.get('statusmessage');
var logger = require('winston').loggers.get('application');

var transport = beans.get('mailtransport');

function statusmessageForError(type, err) {
  return statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_reason', {
    type: type,
    err: err.toString()
  });
}

function statusmessageForSuccess(type) {
  return statusmessage.successMessage('message.title.email_successful', 'message.content.mailsender.success', {type: type});
}

// TODO remove duplication with mailsenderService!
function sendMail(message, type, callback) {
  transport.sendMail(message.toTransportObject(conf.get('sender-address')), function (err) {
    if (err) { logger.error(err.stack); }
    callback(null, err ? statusmessageForError(type, err) : statusmessageForSuccess(type));
  });
}

module.exports = {

  sendMailToAllSubscribers: function (message, globalCallback) {
    var type = '$t(mailsender.invitation)';
    subscriberstore.allSubscribers(function (err, subscribers) {
      if (err) { return globalCallback(err, statusmessageForError(type, err)); }

      async.map(subscribers, function (subscriber, callback) { memberstore.getMemberForId(subscriber.id(), callback); }, function (err1, members) {
        if (err1) { return globalCallback(err1, statusmessageForError(type, err1)); }
        message.setBccToMemberAddresses(members);
        logger.info('BCC: ' + message.bcc);
        sendMail(message, type, globalCallback);
      });

    });
  },

  sendMailToParticipantsOf: function (year, message, callback) {
    var type = '$t(mailsender.reminder)';
    return activityParticipantService.getParticipantsFor(year, function (err, participants) {
      if (err) { return callback(err, statusmessageForError(type, err)); }
      message.setBccToMemberAddresses(participants);
      sendMail(message, type, callback);
    });
  }

};
