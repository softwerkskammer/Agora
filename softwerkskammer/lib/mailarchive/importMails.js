'use strict';
const moment = require('moment-timezone');

const path = require('path');

/*eslint no-sync: 0 */
const winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
const logger = winston.loggers.get('scripts');

const MailParser = require('mailparser').MailParser;
const fs = require('fs');
const crypto = require('crypto');

const beans = require('simple-configure').get('beans');
const fieldHelpers = beans.get('fieldHelpers');
const memberstore = beans.get('memberstore');

module.exports = function importMails(file, group, done) {
  function date(parsedObject) {
    if (fieldHelpers.isFilled(parsedObject.headers.date)) {
      return moment(parsedObject.headers.date, 'ddd, DD MMM YYYY HH:mm:ss ZZ', 'en');
    }
    logger.info('No date found in eMail with subject: ' + parsedObject.subject);
    return moment();
  }

  function getMessageId(parsedObject, callback) {
    /* eslint new-cap: 0 */
    if (parsedObject.messageId) {
      return callback(parsedObject.messageId);
    }

    const shasum = crypto.createHash('sha1');
    const s = fs.createReadStream(file); // file may be big -> stream instead of readFile
    s.on('data', d => shasum.update(d));
    s.on('end', () => callback('mail-sha1-' + shasum.digest('hex') + '@softwerkskammer.org'));
  }

  function references(parsedObject) {
    if (fieldHelpers.isFilled(parsedObject.references)) {
      return parsedObject.references;
    }
    if (fieldHelpers.isFilled(parsedObject.inReplyTo)) {
      return [parsedObject.inReplyTo[0]];
    }
    logger.info('No references found for eMail with subject: ' + parsedObject.subject);
    return null;
  }

  const mailparser = new MailParser({
    // remove mail attachments
    streamAttachments: true
  });

  mailparser.on('end', parsedObject => {
    logger.info('Starting to parse eMail');
    const from = parsedObject.from[0];

    memberstore.getMemberForEMail(from.address, (err, member) => {
      if (err) {
        logger.error('Could not get member for eMail, error is: ' + err);
        return done(err);
      }
      const mailDbObject = {};
      mailDbObject.group = group;
      mailDbObject.subject = parsedObject.subject;
      mailDbObject.text = parsedObject.text;
      mailDbObject.html = parsedObject.html;

      mailDbObject.timeUnix = date(parsedObject).unix();
      mailDbObject.references = references(parsedObject);

      mailDbObject.from = {
        name: from.name || from.address.replace(/@.*/, '')
      };
      if (member) { mailDbObject.from.id = member.id(); }
      getMessageId(parsedObject, id => {
        mailDbObject.id = id;
        logger.info('Message ID assigned to eMail: ' + mailDbObject.id);
        done(null, mailDbObject);
      });
    });
  });

  fs.createReadStream(file).pipe(mailparser);
};
