'use strict';

process.chdir(__dirname);
const conf = require('simple-configure');
const Beans = require('CoolBeans');
const NodeCache = require('node-cache');
const path = require('path');

function createConfiguration() {
  const configdir = path.join(__dirname, '/../config/');

  // first, set the default values
  // beans:
  const swkBeans = require(configdir + 'beans.json');
  const socratesBeans = require(configdir + 'beans-socrates.json');
  Object.assign(swkBeans, socratesBeans);

  conf.addProperties({
    port: '17224',
    mongoURL: 'mongodb://localhost:27017/swk',
    publicUrlPrefix: 'http://localhost:17224',
    securedByLoginURLPattern: '^/wiki|' +
    '^/mailsender|' +
    '^/members',
    securedBySuperuserURLPattern: '^/rightNowThereIsNoSuperuserOnlyURL',
    securedBySoCraTesAdminURLPattern: '^/mailsender/massMailing|^/activities',
    secret: 'secret',
    sessionkey: 'socrates-conference.de',
    beans: new Beans(swkBeans),
    cache: new NodeCache({stdTTL: 0, checkperiod: 0, errorOnMissing: false, useClones: false}),
    emaildomainname: 'localhost',
    softwerkskammerURL: 'http://localhost:17124',
    socratesURL: 'http://localhost:17224',
    jwtSecret: 'my_very_secret',
    socratesAdmins: []
  });

  // then, add properties from config files:
  const files = ['mongo-config.json',
    'ezmlm-config.json',
    'socrates-server-config.json',
    'authentication-config.json',
    'socrates-authentication-config.json',
    'mailsender-config.json',
    'socrates-mailsender-config.json',
    'socrates-wikirepo-config.json',
    'activityresults-config.json',
    'crosssite-config.json'];
  conf.addFiles(files.map(file => configdir + file));

  return conf;
}
module.exports = createConfiguration();

