"use strict";

module.exports = function (kindOfTest) {
  const conf = require("simple-configure");
  require("./shutupWinston")();

  // first, set the normal configuration
  require("../configure");

  // then, overwrite what needs to be changed:

  conf.addProperties({
    dontUsePersistentSessions: true,
    doNotSendMails: "",
    emaildomainname: "localhost",
    fullyQualifiedHomeDir: null,
    githubClientID: null,
    githubClientSecret: null,
    imageDirectory: null,
    port: "17125",
    "sender-address": null,
    publicUrlPrefix: "http://localhost:17125",
    secret: "secret",
    sessionkey: "testsession",
    socratesURL: "https://socrates.com:12345",
    sqlitedb: "../../../db/test-db.db",
    superuser: "superuserID",
    "transport-options": null,
    wikipath: "..",
    TESTMODE: kindOfTest,
  });

  return conf;
};
