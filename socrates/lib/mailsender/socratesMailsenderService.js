'use strict';

var async = require('async');

var conf = require('simple-configure');

var beans = conf.get('beans');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var activityParticipantService = beans.get('activityParticipantService');
var logger = require('winston').loggers.get('application');

var mailtransport = beans.get('mailtransport');

function sendMail(message, type, callback) {
  mailtransport.sendMail(message, type, conf.get('sender-address'), callback);
}

module.exports = {

  sendMailToAllSubscribers: function (message, globalCallback) {
    var type = '$t(mailsender.invitation)';
    subscriberstore.allSubscribers(function (err, subscribers) {
      if (err) { return globalCallback(err, mailtransport.statusmessageForError(type, err)); }

      async.map(subscribers, function (subscriber, callback) { memberstore.getMemberForId(subscriber.id(), callback); }, function (err1, members) {
        if (err1) { return globalCallback(err1, mailtransport.statusmessageForError(type, err1)); }
        message.setBccToMemberAddresses(members);
        logger.info('BCC: ' + message.bcc);
        sendMail(message, type, globalCallback);
      });

    });
  },

  sendMailToParticipantsOf: function (year, message, callback) {
    var type = '$t(mailsender.reminder)';
    return activityParticipantService.getParticipantsFor(year, function (err, participants) {
      if (err) { return callback(err, mailtransport.statusmessageForError(type, err)); }
      message.setBccToMemberAddresses(participants);
      sendMail(message, type, callback);
    });
  }

};
