"use strict";

process.chdir(__dirname);
const Beans = require("CoolBeans");
const conf = require("simple-configure");
const path = require("path");

function createConfiguration() {
  const configdir = path.join(__dirname, "/../config/");

  // first, set the default values
  conf.addProperties({
    adminListName: "admins",
    port: "17124",
    sqlitedb: "../../../db/automatic.db",
    publicUrlPrefix: "http://localhost:17124",
    securedByLoginURLPattern:
      "/activityresults|" +
      "/gallery|" +
      "/mailsender|" +
      "/members|" +
      "/new|" +
      "/edit|" +
      "/submit|" +
      "/subscribe|" +
      "/invitation|" +
      "/addToWaitinglist|" +
      "/addon|" +
      "/submitAddon|" +
      "/payment|" +
      "dashboard",
    securedBySuperuserURLPattern: "^/administration/",
    secret: "secret",
    sessionkey: "softwerkskammer.org",
    beans: new Beans(configdir + "beans.json"),
    emaildomainname: "localhost",
    socratesURL: "http://socrates-conference.de",
    reservedActivityURLs:
      "^socrates-|^gdcr$|^upcoming$|^past$|^ical$|^eventsForSidebar$|^new$|^newLike$|^edit$|^submit$|^checkurl$|^subscribe$|^unsubscribe$|^addToWaitinglist$|^removeFromWaitinglist$|\\+",
    magicLinkSecret: "Locally? What do you expect?",
  });

  // then, add properties from config files:
  const files = [
    "server-config.json",
    "authentication-config.json",
    "mailsender-config.json",
    "wikirepo-config.json",
    "activityresults-config.json",
  ];
  conf.addFiles(files.map((file) => configdir + file));

  return conf;
}
module.exports = createConfiguration();
