'use strict';
const moment = require('moment-timezone');
const beans = require('simple-configure').get('beans');
const fieldHelpers = beans.get('fieldHelpers');
const memberstore = beans.get('memberstore');

const path = require('path');

/*eslint no-sync: 0 */
const winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
const logger = winston.loggers.get('scripts');

const MailParser = require('mailparser').MailParser;
const fs = require('fs');
const crypto = require('crypto');

module.exports = function importMails(file, group, done) {
  function date(parsedObject) {
    if (fieldHelpers.isFilled(parsedObject.headers.date)) {
      return moment(parsedObject.headers.date, 'ddd, DD MMM YYYY HH:mm:ss ZZ', 'en');
    }
    logger.info('No date found in eMail with subject: ' + parsedObject.subject);
    return moment();
  }

  function assignMessageId(parsedObject, mailDbObject, done1) {
    /* eslint new-cap: 0 */
    if (parsedObject.messageId) {
      mailDbObject.id = parsedObject.messageId;
      done1(null, mailDbObject);
      return;
    }

    const shasum = crypto.createHash('sha1');
    const s = fs.ReadStream(file);
    s.on('data', d => shasum.update(d));

    s.on('end', () => {
      const d = shasum.digest('hex');
      mailDbObject.id = 'mail-sha1-' + d + '@softwerkskammer.org';
      done1(null, mailDbObject);
    });
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

  function name(fromStructure) {
    if (fromStructure.name) {
      return fromStructure.name;
    }
    return fromStructure.address.replace(/@.*/, '');
  }

  const mailparser = new MailParser({
    // remove mail attachments
    streamAttachments: true
  });

  mailparser.on('end', parsedObject => {
    logger.info('Starting to parse eMail');
    const mailDbObject = {};
    mailDbObject.group = group;
    mailDbObject.subject = parsedObject.subject;

    mailDbObject.timeUnix = date(parsedObject).unix();

    mailDbObject.references = references(parsedObject);
    mailDbObject.text = parsedObject.text;
    mailDbObject.html = parsedObject.html;

    const from = parsedObject.from[0];
    mailDbObject.from = {
      name: name(from)
    };
    memberstore.getMemberForEMail(from.address, (err, member) => {
      if (err) {
        logger.error('Could not get member for eMail: ' + err);
        return done(err);
      }
      if (member) { mailDbObject.from.id = member.id(); }
      assignMessageId(parsedObject, mailDbObject, () => {
        logger.info('Message ID assigned to eMail: ' + mailDbObject.id);
        done(null, mailDbObject);
      });
    });
  });

  fs.createReadStream(file).pipe(mailparser);
};
