"use strict";
const R = require("ramda");

const conf = require("simple-configure");

const beans = conf.get("beans");
const doNotSendMails = conf.get("doNotSendMails") || "";
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

async function sendMail(message, type, senderAddress, includeFooter) {
  const transportObject = message.toTransportObject(senderAddress, includeFooter);
  if (doNotSendMails && transportObject.bcc && transportObject.bcc.length > 0) {
    logger.info(JSON.stringify(transportObject, null, 2));
    delete transportObject.to;
    transportObject.bcc = doNotSendMails;
  }
  try {
    const info = await transport.sendMail(transportObject);
    if (info) {
      logger.info("Nodemailer sendMail report: " + JSON.stringify(info));
    }
    return statusmessageForSuccess(type);
  } catch (e) {
    if (e) {
      logger.error(e.stack);
      return statusmessageForError(type, e);
    }
  }
}

async function sendBulkMail(receiverEmailAddresses, subject, html, fromName, fromAddress) {
  /* eslint consistent-return: 0 */
  if (!receiverEmailAddresses || receiverEmailAddresses.length === 0) {
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
  try {
    const info = await transport.sendMail(mailoptions);
    logger.info("Notification sent. Content: " + JSON.stringify(mailoptions));
    logger.info("Nodemailer sendBulkMail report: " + JSON.stringify(info));
  } catch (e) {
    return logger.error(e);
  }
}

module.exports = {
  transport,
  sendMail,
  sendBulkMail,
  statusmessageForError,
  statusmessageForSuccess,
};
