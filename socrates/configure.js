'use strict';

process.chdir(__dirname);
var _ = require('lodash');
var conf = require('simple-configure');
var Beans = require('CoolBeans');
var path = require('path');

function createConfiguration() {
  var configdir = path.join(__dirname, '/../config/');

  // first, set the default values
  // beans:
  var swkBeans = require(configdir + 'beans.json');
  var socratesBeans = require(configdir + 'beans-socrates.json');
  _.assign(swkBeans, socratesBeans);

  conf.addProperties({
    port: '17224',
    mongoURL: 'mongodb://localhost:27017/swk',
    publicUrlPrefix: 'http://localhost:17224',
    securedByLoginURLPattern: '/wiki|' +
    '/mailsender|' +
    '/members',
    securedBySuperuserURLPattern: '^/activities',
    securedBySoCraTesAdminURLPattern: '^/mailsender/massMailing',
    secret: 'secret',
    sessionkey: 'socrates-conference.de',
    beans: new Beans(swkBeans),
    emaildomainname: 'localhost',
    softwerkskammerURL: 'http://localhost:17124',
    socratesURL: 'http://localhost:17224',
    jwtSecret: 'my_very_secret',
    socratesAdmins: []
  });

  // then, add properties from config files:
  var files = ['mongo-config.json',
    'ezmlm-config.json',
    'socrates-server-config.json',
    'authentication-config.json',
    'socrates-authentication-config.json',
    'mailsender-config.json',
    'socrates-mailsender-config.json',
    'socrates-wikirepo-config.json',
    'activityresults-config.json',
    'crosssite-config.json'];
  conf.addFiles(_.map(files, function (file) { return configdir + file; }));

  return conf;
}
module.exports = createConfiguration();

