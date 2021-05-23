const R = require('ramda');

const conf = require('simple-configure');

const beans = conf.get('beans');
const statusmessage = beans.get('statusmessage');
const logger = require('winston').loggers.get('application');

// we need to expose the core in order to stub that during automated tests
const transport = beans.get('nodemailerTransport');

function statusmessageForError(type, err) {
  return statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_reason', {
    type,
    err: err.toString()
  });
}

function statusmessageForSuccess(type) {
  return statusmessage.successMessage('message.title.email_successful', 'message.content.mailsender.success', {type});
}

function sendMail(message, type, senderAddress, includeFooter, callback) {
  transport.sendMail(message.toTransportObject(senderAddress, includeFooter), err => {
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
    bcc: R.uniq(receiverEmailAddresses).toString(),
    subject,
    html,
    generateTextFromHTML: true
  };

  if (callback) { return transport.sendMail(mailoptions, callback); }

  transport.sendMail(mailoptions, err => {
    if (err) { return logger.error(err); }
    logger.info('Notification sent. Content: ' + JSON.stringify(mailoptions));
  });
}

module.exports = {
  transport,
  sendMail,
  sendBulkMail,
  statusmessageForError,
  statusmessageForSuccess
};
