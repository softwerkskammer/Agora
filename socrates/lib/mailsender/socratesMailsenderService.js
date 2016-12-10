'use strict';

const async = require('async');

const conf = require('simple-configure');

const beans = conf.get('beans');
const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');
const activityParticipantService = beans.get('activityParticipantService');
const logger = require('winston').loggers.get('application');

const mailtransport = beans.get('mailtransport');

function sendMail(message, type, callback) {
  mailtransport.sendMail(message, type, conf.get('sender-address'), callback);
}

module.exports = {

  sendMailToAllSubscribers: function sendMailToAllSubscribers(message, globalCallback) {
    const type = '$t(mailsender.invitation)';
    subscriberstore.allSubscribers((err, subscribers) => {
      if (err) { return globalCallback(err, mailtransport.statusmessageForError(type, err)); }

      async.map(subscribers, (subscriber, callback) => memberstore.getMemberForId(subscriber.id(), callback), (err1, members) => {
        if (err1) { return globalCallback(err1, mailtransport.statusmessageForError(type, err1)); }
        message.setBccToMemberAddresses(members);
        logger.info('BCC: ' + message.bcc);
        sendMail(message, type, globalCallback);
      });

    });
  },

  sendMailToParticipantsOf: function sendMailToParticipantsOf(year, message, callback) {
    const type = '$t(mailsender.reminder)';
    return activityParticipantService.getParticipantsFor(year, (err, participants) => {
      if (err) { return callback(err, mailtransport.statusmessageForError(type, err)); }
      message.setBccToMemberAddresses(participants);
      sendMail(message, type, callback);
    });
  }

};
