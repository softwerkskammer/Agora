"use strict";
var conf = require("../../configure")();
var persistence = conf.get('beans').get('mailsPersistence');
var file = process.argv[2];
var group = process.argv[3];
require('./importMails')(file, group, function (err, mailDbObject) {
  if (err == null) {
    persistence.save(mailDbObject, function () {
      console.log(mailDbObject.subject);
    });
  }
});
