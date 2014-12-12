'use strict';

process.chdir(__dirname);
var nconf = require('nconf');
var Beans = require('CoolBeans');
var merge = require('utils-merge');

function createConfiguration() {
  // create an nconf object, and initialize it with given values from
  // the environment variables and/or from the command line
  nconf.argv().env();
  var configdir = '../config/';
  nconf.file('mongo', configdir + 'mongo-config.json');
  nconf.file('sympa', configdir + 'sympa-config.json');
  nconf.file('server', configdir + 'socrates-server-config.json');
  nconf.file('authentication', configdir + 'authentication-config.json');
  nconf.file('mail', configdir + 'mailsender-config.json');
  nconf.file('wiki', configdir + 'socrates-wikirepo-config.json');
  nconf.file('crossite', configdir + 'crosssite-config.json');

  // beans:
  var swkBeans = require(configdir + 'beans.json');
  var socratesBeans = require(configdir + 'beans-socrates.json');
  merge(swkBeans, socratesBeans);

  nconf.defaults({
    port: '17224',
    mongoURL: 'mongodb://localhost:27017/swk',
    publicUrlPrefix: 'http://localhost:17224',
    securedByLoginURLPattern:
      '/wiki|' +
      '/mailsender|' +
      '/members',

    secret: 'secret',
    sessionkey: 'socrates-conference.de',
    beans: new Beans(swkBeans),
    emaildomainname: 'localhost',
    softwerkskammerURL: 'http://localhost:17124',
    socratesURL: 'http://localhost:17224',
    jwt_secret: 'my_very_secret'
  });

  return nconf;
}
module.exports = createConfiguration();

