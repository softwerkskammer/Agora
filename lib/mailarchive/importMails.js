"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var membersAPI = conf.get('beans').get('membersAPI');
var moment = require('moment');

var MailParser = require("mailparser").MailParser;
var fs = require("fs");

module.exports = function (file, group, done) {
  function date(parsedObject) {
    if (fieldHelpers.isFilled(parsedObject.headers["date"])) {
      return moment(parsedObject.headers["date"]);
    }
    return moment();
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
    if (!parsedObject.messageId) {
      done(new Error("message has no Id"), parsedObject);
    }
    var mailDbObject = {};
    mailDbObject.group = group;
    mailDbObject.subject = parsedObject.subject;

    mailDbObject.timeUnix = date(parsedObject).unix();
    mailDbObject.id = parsedObject.messageId;

    mailDbObject.references = references(parsedObject);
    mailDbObject.text = fieldHelpers.replaceMailAddresses(parsedObject.text);
    mailDbObject.html = fieldHelpers.replaceMailAddresses(parsedObject.html);

    var from = parsedObject.from[0];
    mailDbObject.from = {
      name: name(from)
    };
    membersAPI.getMemberForEMail(from.address, function (err, member) {
      if (err == null && member != null) { // Achtung undefined!
        mailDbObject.from.id = member.id;
      }
      done(err, mailDbObject);
    });
  });
  fs.createReadStream(file).pipe(mailparser);
};
