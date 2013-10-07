"use strict";
var conf = require("../../configure");
var persistence = conf.get('beans').get('mailsPersistence');
var file = process.argv[2];
var group = process.argv[3].replace(/@softwerkskammer.org/g, ''); // remove trailing domain
require('./importMails')(file, group, function (err, mailDbObject) {
  if (err == null) {
    persistence.save(mailDbObject, function (err) {
      if (err != null) {
        console.log(err);
      }
      console.log(mailDbObject.subject);
      persistence.closeDB();
    });
  }
});
