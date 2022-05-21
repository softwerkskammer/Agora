const R = require("ramda");

const conf = require("simple-configure");

const beans = conf.get("beans");
const doNotSendMails = conf.get("doNotSendMails") || false;
const statusmessage = beans.get("statusmessage");
const logger = require("winston").loggers.get("application");

// we need to expose the core in order to stub that during automated tests
const transport = beans.get("nodemailerTransport");

function statusmessageForError(type, err) {
  return statusmessage.errorMessage("message.title.email_problem", "message.content.mailsender.error_reason", {
    type,
    err: err.toString(),
  });
}

function statusmessageForSuccess(type) {
  return statusmessage.successMessage("message.title.email_successful", "message.content.mailsender.success", { type });
}

function sendMail(message, type, senderAddress, includeFooter, callback) {
  const transportObject = message.toTransportObject(senderAddress, includeFooter);
  if (doNotSendMails) {
    const withoutAttachments = JSON.parse(JSON.stringify(transportObject));
    delete withoutAttachments.attachments;
    logger.info(JSON.stringify(withoutAttachments, null, 2));
    delete transportObject.to;
    transportObject.bcc = doNotSendMails;
  }
  transport.sendMail(transportObject, (err, info) => {
    if (err) {
      logger.error(err.stack);
    }
    if (info) {
      logger.info("Nodemailer sendMail report: " + JSON.stringify(info));
    }
    callback(null, err ? statusmessageForError(type, err) : statusmessageForSuccess(type));
  });
}

function sendBulkMail(receiverEmailAddresses, subject, html, fromName, fromAddress, callback) {
  /* eslint consistent-return: 0 */
  if (!receiverEmailAddresses || receiverEmailAddresses.length === 0) {
    if (callback) {
      return callback(null);
    }
    return;
  }

  const mailoptions = {
    from: '"' + fromName + '" <' + fromAddress + ">",
    bcc: R.uniq(receiverEmailAddresses).toString(),
    subject,
    html,
    generateTextFromHTML: true,
  };

  if (doNotSendMails) {
    logger.info(JSON.stringify(mailoptions, null, 2));
    delete mailoptions.to;
    mailoptions.bcc = doNotSendMails;
  }
  if (callback) {
    return transport.sendMail(mailoptions, callback);
  }

  transport.sendMail(mailoptions, (err, info) => {
    if (err) {
      return logger.error(err);
    }
    logger.info("Notification sent. Content: " + JSON.stringify(mailoptions));
    logger.info("Nodemailer sendBulkMail report: " + JSON.stringify(info));
  });
}

module.exports = {
  transport,
  sendMail,
  sendBulkMail,
  statusmessageForError,
  statusmessageForSuccess,
};
