"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var membersAPI = conf.get('beans').get('membersAPI');
var moment = require('moment-timezone');

var MailParser = require("mailparser").MailParser;
var fs = require("fs");
var crypto = require('crypto');

module.exports = function (file, group, done) {
  function date(parsedObject) {
    if (fieldHelpers.isFilled(parsedObject.headers["date"])) {
      return moment(parsedObject.headers["date"]);
    }
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
      mailDbObject.id = "mail-sha1-" + d + "@softwerkskammer.org";
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
    return null;
  }

  function name(fromStructure) {
    if (fromStructure.name) {
      return fromStructure.name;
    }
    return fromStructure.address.replace(/@.*/, "");
  }

  var mailparser = new MailParser({
    // remove mail attachments
    streamAttachments: true
  });

  mailparser.on("end", function (parsedObject) {
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
    membersAPI.getMemberForEMail(from.address, function (err, member) {
      if (err) { return done(err); }
      if (member) { mailDbObject.from.id = member.id; }
      assignMessageId(parsedObject, mailDbObject, function () {
        done(null, mailDbObject);
      });
    });
  });
  fs.createReadStream(file).pipe(mailparser);
};
