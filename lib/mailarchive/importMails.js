"use strict";
require("../../configure")();
var conf = require('nconf');
var fieldHelpers = conf.get('beans').get('fieldHelpers');
var persistence = conf.get('beans').get('mailsPersistence');

var file = process.argv[2];
var group = process.argv[3];

var MailParser = require("mailparser").MailParser,
  mailparser = new MailParser({
// remove mail attachments
    streamAttachments: true
  }),
  fs = require("fs");

mailparser.on("end", function (parsedObject) {
  var mailDbObject = {};
  mailDbObject.group = group;
  mailDbObject.subject = parsedObject.subject;
  var from = parsedObject.from[0];
  mailDbObject.from = fieldHelpers.valueOrFallback(from.name, from.address);
  if (fieldHelpers.isFilled(parsedObject.headers["date"])) {
    mailDbObject.dateUnix = Date.parse(parsedObject.headers["date"]);
  }
  else {
    mailDbObject.dateUnix = Date.now;
  }
  mailDbObject.id = parsedObject.headers["message-id"];
  mailDbObject.references = fieldHelpers.valueOrFallback(parsedObject.references, parsedObject.inReplyTo);
  mailDbObject.text = parsedObject.text;
  mailDbObject.html = parsedObject.html;
  persistence.save(mailDbObject, function () {
  });
  console.log(mailDbObject.subject);
});

fs.createReadStream(file).pipe(mailparser);
