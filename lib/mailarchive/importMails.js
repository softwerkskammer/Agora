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
    mailDbObject.dateUnix = date.unix();
    mailDbObject.id = parsedObject.headers["message-id"];
    mailDbObject.references = fieldHelpers.valueOrFallback(parsedObject.references, parsedObject.inReplyTo);
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
