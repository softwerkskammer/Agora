'use strict';

const _ = require('lodash');

const conf = require('simple-configure');

const beans = conf.get('beans');
const statusmessage = beans.get('statusmessage');
const logger = require('winston').loggers.get('application');

// we need to expose the core in order to stub that during automated tests
const transport = require('nodemailer').createTransport(require('simple-configure').get('transport-options'));

function statusmessageForError(type, err) {
  return statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_reason', {
    type: type,
    err: err.toString()
  });
}

function statusmessageForSuccess(type) {
  return statusmessage.successMessage('message.title.email_successful', 'message.content.mailsender.success', {type: type});
}

function sendMail(message, type, senderAddress, callback) {
  transport.sendMail(message.toTransportObject(senderAddress), err => {
    if (err) { logger.error(err.stack); }
    callback(null, err ? statusmessageForError(type, err) : statusmessageForSuccess(type));
  });
}

function sendBulkMail(receiverEmailAddresses, subject, html, fromName, fromAddress, callback) {
  /* eslint consistent-return: 0 */
  if (!receiverEmailAddresses || receiverEmailAddresses.length === 0) {
    if (callback) { return callback(null); }
    return;
  }

  const mailoptions = {
    from: '"' + fromName + '" <' + fromAddress + '>',
    bcc: _.uniq(receiverEmailAddresses).toString(),
    subject: subject,
    html: html,
    generateTextFromHTML: true
  };

  if (callback) { return transport.sendMail(mailoptions, callback); }

  transport.sendMail(mailoptions, err => {
    if (err) { return logger.error(err); }
    logger.info('Notification sent. Content: ' + JSON.stringify(mailoptions));
  });
}

module.exports = {
  transport: transport,
  sendMail: sendMail,
  sendBulkMail: sendBulkMail,
  statusmessageForError: statusmessageForError,
  statusmessageForSuccess: statusmessageForSuccess
};
