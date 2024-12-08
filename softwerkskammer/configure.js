"use strict";

process.chdir(__dirname);
const conf = require("simple-configure");
const path = require("path");

function createConfiguration() {
  const configdir = path.join(__dirname, "/../config/");

  // first, set the default values (alphabetically)
  conf.addProperties({
    adminListName: "admins",
    emaildomainname: "localhost",
    magicLinkSecret: "Locally? What do you expect?",
    port: "17124",
    publicUrlPrefix: "http://localhost:17124",
    reservedActivityURLs:
      "^socrates-|^gdcr$|^upcoming$|^past$|^ical$|^eventsForSidebar$|^new$|^newLike$|^edit$|^submit$|^checkurl$|^subscribe$|^unsubscribe$|^addToWaitinglist$|^removeFromWaitinglist$|\\+",
    secret: "secret",
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
    sessionkey: "softwerkskammer.org",
    socratesURL: "http://socrates-conference.de",
    sqlitedb: "../../../db/automatic.db",
    TESTMODE: false,
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
