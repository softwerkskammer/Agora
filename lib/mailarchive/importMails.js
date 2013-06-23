"use strict";
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var membersAPI = conf.get('beans').get('membersAPI');
var moment = require('moment');

var MailParser = require("mailparser").MailParser;
var fs = require("fs");

module.exports = function (file, group, done) {
  var mailparser = new MailParser({
// remove mail attachments
    streamAttachments: true
  });

  mailparser.on("end", function (parsedObject) {
    if (!parsedObject.messageId) {
      done("message has no Id", parsedObject);
    }
    var mailDbObject = {};
    mailDbObject.group = group;
    mailDbObject.subject = parsedObject.subject;
    var from = parsedObject.from[0];
    mailDbObject.from = {
      name: from.name,
      address: from.address
    };
    var date;
    if (fieldHelpers.isFilled(parsedObject.headers["date"])) {
      date = moment(parsedObject.headers["date"]);
    }
    else {
      date = moment();
    }
    mailDbObject.timeUnix = date.unix();
    mailDbObject.id = parsedObject.messageId;
    if (fieldHelpers.isFilled(parsedObject.references)) {
      mailDbObject.references = parsedObject.references;
    }
    else if (fieldHelpers.isFilled(parsedObject.inReplyTo)) {
      mailDbObject.references = [parsedObject.inReplyTo[0]];
    }
    else {
      mailDbObject.references = null;
    }
    mailDbObject.text = parsedObject.text;
    mailDbObject.html = parsedObject.html;
    membersAPI.getMemberForEMail(from.address, function (err, member) {
      if (err == null && member != null) {
        mailDbObject.from.id = member.id;
      }
      done(err, mailDbObject);
    });
  });
  fs.createReadStream(file).pipe(mailparser);
};
