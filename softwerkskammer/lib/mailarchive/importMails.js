'use strict';
const moment = require('moment-timezone');

const path = require('path');

/*eslint no-sync: 0 */
const winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
const logger = winston.loggers.get('scripts');

const simpleParser = require('mailparser').simpleParser;
const fs = require('fs');
const crypto = require('crypto');

const beans = require('simple-configure').get('beans');
const fieldHelpers = beans.get('fieldHelpers');
const memberstore = beans.get('memberstore');

module.exports = function importMails(file, group, done) {

  function removeLeadingAndTrailingBrackets(string) {
    return string.replace(/^</, '').replace(/>$/, '');
  }

  function date(parsedObject) {
    if (parsedObject.headers.has('date')) {
      return moment(parsedObject.headers.get('date'), 'ddd, DD MMM YYYY HH:mm:ss ZZ', 'en');
    }
    logger.info('No date found in eMail with subject: ' + parsedObject.subject);
    return moment();
  }

  function getMessageId(parsedObject, callback) {
    /* eslint new-cap: 0 */
    if (parsedObject.messageId) {
      return callback(removeLeadingAndTrailingBrackets(parsedObject.messageId));
    }

    const shasum = crypto.createHash('sha1');
    const s = fs.createReadStream(file); // file may be big -> stream instead of readFile
    s.on('data', d => shasum.update(d));
    s.on('end', () => callback('mail-sha1-' + shasum.digest('hex') + '@softwerkskammer.org'));
  }

  function references(parsedObject) {
    if (fieldHelpers.isFilled(parsedObject.references)) {
      return parsedObject.references.map(removeLeadingAndTrailingBrackets);
    }
    if (fieldHelpers.isFilled(parsedObject.inReplyTo)) {
      return parsedObject.inReplyTo.split(' ').map(removeLeadingAndTrailingBrackets);
    }
    logger.info('No references found for eMail with subject: ' + parsedObject.subject);
    return null;
  }

  simpleParser(fs.createReadStream(file), (err, parsedObject) => {
    logger.info('Starting to parse eMail');
    if (err) {
      logger.error('Could not parse eMail, error is: ' + err);
      return done(err);
    }
    const from = parsedObject.from.value[0];

    memberstore.getMemberForEMail(from.address, (err1, member) => {
      if (err1) {
        logger.error('Could not get member for eMail, error is: ' + err1);
        return done(err1);
      }
      const mailDbObject = {
        group,
        subject: parsedObject.subject,
        text: parsedObject.text,
        html: parsedObject.html,
        timeUnix: date(parsedObject).unix(),
        references: references(parsedObject),
        from: {name: from.name || from.address.replace(/@.*/, ''), id: (member ? member.id() : undefined)}
      };

      getMessageId(parsedObject, id => {
        mailDbObject.id = id;
        logger.info('Message ID assigned to eMail: ' + mailDbObject.id);
        done(null, mailDbObject);
      });
    });
  });
};
