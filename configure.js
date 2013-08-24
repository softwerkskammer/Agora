"use strict";

process.chdir(__dirname);
var nconf = require('nconf');
var beans = require('CoolBeans');

function createConfiguration() {
// create an nconf object, and initialize it with given values from
// the environment variables and/or from the command line
  nconf.argv().env();
  nconf.file('mongo', './config/mongo-config.json');
  nconf.file('sympa', './config/sympa-config.json');
  nconf.file('server', './config/server-config.json');
  nconf.file('authentication', './config/authentication-config.json');
  nconf.file('mail', './config/mailsender-config.json');
  nconf.file('wiki', './config/wikirepo-config.json');
  nconf.defaults({
    adminListName: "admins",
    port: '17124',
    mongoHost: 'localhost',
    mongoPort: '27017',
    publicUrlPrefix: "http://localhost:17124",
    adminURLPattern: "/administration/|/new|/edit|/submit|/invitation",
    securedByLoginURLPattern: "/mailsender|/members|/(subscribe|unsubscribe)/",
    secret: "secret",
    beans: new beans('./config/beans.json')
  });

  return nconf;
}
module.exports = createConfiguration();

