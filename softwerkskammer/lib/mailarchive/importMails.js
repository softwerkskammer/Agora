/*jslint regexp: true*/
'use strict';
var conf = require('simple-configure');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var memberstore = conf.get('beans').get('memberstore');
var moment = require('moment-timezone');

var path = require('path');
/*jslint stupid: true */
var winston = require('winston-config').fromFileSync(path.join(__dirname, '../../../config/winston-config.json'));
/*jslint stupid: false */
var logger = winston.loggers.get('scripts');

var MailParser = require('mailparser').MailParser;
var fs = require('fs');
var crypto = require('crypto');

module.exports = function (file, group, done) {
  function date(parsedObject) {
    if (fieldHelpers.isFilled(parsedObject.headers.date)) {
      return moment(parsedObject.headers.date, 'ddd, DD MMM YYYY HH:mm:ss ZZ', 'en');
    }
    logger.info('No date found in eMail with subject: ' + parsedObject.subject);
    return moment();
  }

  function assignMessageId(parsedObject, mailDbObject, done) {
    if (parsedObject.messageId) {
      mailDbObject.id = parsedObject.messageId;
      done(null, mailDbObject);
      return;
    }

    var shasum = crypto.createHash('sha1');
    var s = fs.ReadStream(file);
    s.on('data', function (d) {
      shasum.update(d);
    });

    s.on('end', function () {
      var d = shasum.digest('hex');
      mailDbObject.id = 'mail-sha1-' + d + '@softwerkskammer.org';
      done(null, mailDbObject);
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

  var mailparser = new MailParser({
    // remove mail attachments
    streamAttachments: true
  });

  mailparser.on('end', function (parsedObject) {
    logger.info('Starting to parse eMail');
    var mailDbObject = {};
    mailDbObject.group = group;
    mailDbObject.subject = parsedObject.subject;

    mailDbObject.timeUnix = date(parsedObject).unix();

    mailDbObject.references = references(parsedObject);
    mailDbObject.text = parsedObject.text;
    mailDbObject.html = parsedObject.html;

    var from = parsedObject.from[0];
    mailDbObject.from = {
      name: name(from)
    };
    memberstore.getMemberForEMail(from.address, function (err, member) {
      if (err) {
        logger.error('Could not get member for eMail: ' + err);
        return done(err);
      }
      if (member) { mailDbObject.from.id = member.id(); }
      assignMessageId(parsedObject, mailDbObject, function () {
        logger.info('Message ID assigned to eMail: ' + mailDbObject.id);
        done(null, mailDbObject);
      });
    });
  });

  logger.info('Before creating read stream');
  fs.createReadStream(file).pipe(mailparser);
  logger.info('After creating read stream');
};
