"use strict";

module.exports = function (testBeansFilename) {
  const conf = require("simple-configure");
  const Beans = require("CoolBeans");
  require("./shutupWinston")();

  // first, set the normal configuration
  require("../configure");

  // then, overwrite what needs to be changed:

  // beans:
  const productionBeans = require("../../config/beans.json");
  const testBeans = require("../../config/" + testBeansFilename);
  const theRealBeans = Object.assign({}, productionBeans, testBeans);

  conf.addProperties({
    port: "17125",
    dontUsePersistentSessions: true,
    superuser: "superuserID",
    wikipath: "..",
    beans: new Beans(theRealBeans),
    transport: null,
    "transport-options": null,
    "sender-address": null,
    publicUrlPrefix: "http://localhost:17125",
    secret: "secret",
    sessionkey: "testsession",
    githubClientID: null,
    githubClientSecret: null,
    publicPaymentKey: null,
    secretPaymentKey: null,
    paymentBic: "paymentBic",
    paymentIban: "paymentIban",
    paymentReceiver: "paymentReceiver",
    emaildomainname: "localhost",
    imageDirectory: null,
    socratesURL: "https://socrates.com:12345",
    fullyQualifiedHomeDir: null,
    doNotSendMails: "",
    sqlitedb: "../../../db/test-db.db",
  });

  return conf;
};
