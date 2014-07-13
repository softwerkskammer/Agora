'use strict';

process.chdir(__dirname);
var nconf = require('nconf');
var Beans = require('CoolBeans');

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
    mongoDB: 'swk',
    publicUrlPrefix: 'http://localhost:17124',
    securedByLoginURLPattern: '/mailsender|/members|/new|/edit|/submit|(subscribe|unsubscribe)/|/mailarchive|/invitation|/addToWaitinglist|/removeFromWaitinglist|/addon|/submitAddon|/wiki/socrates.*/|/payment|dashboard',
    secret: 'secret',
    beans: new Beans('./config/beans.json'),
    domainname: 'localhost'
  });

  return nconf;
}
module.exports = createConfiguration();

