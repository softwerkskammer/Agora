'use strict';

process.chdir(__dirname);
var _ = require('lodash');
var Beans = require('CoolBeans');
var conf = require('simple-configure');
var path = require('path');

function createConfiguration() {
  var configdir = path.join(__dirname, '/../config/');

  // first, set the default values
  conf.addProperties({
    adminListName: 'admins',
    port: '17124',
    mongoURL: 'mongodb://localhost:27017/swk',
    publicUrlPrefix: 'http://localhost:17124',
    securedByLoginURLPattern: '/activityresults|' +
      '/gallery|' +
      '/mailsender|' +
      '/members|' +
      '/new|' +
      '/edit|' +
      '/submit|' +
      '/subscribe|' +
      '/mailarchive|' +
      '/invitation|' +
      '/addToWaitinglist|' +
      '/addon|' +
      '/submitAddon|' +
      '/wiki/socrates.*/|' +
      '/payment|' +
      'dashboard',
    securedBySuperuserURLPattern: '^\/administration\/',
    secret: 'secret',
    sessionkey: 'softwerkskammer.org',
    beans: new Beans(configdir + 'beans.json'),
    emaildomainname: 'localhost',
    softwerkskammerURL: 'http://localhost:17124',
    socratesURL: 'http://localhost:17224',
    jwtSecret: 'my_very_secret',
    reservedActivityURLs: '^socrates-|^gdcr$|^upcoming$|^past$|^ical$|^eventsForSidebar$|^new$|^newLike$|^edit$|^submit$|^checkurl$|^subscribe$|^unsubscribe$|^addToWaitinglist$|^removeFromWaitinglist$|\\+'

});

  // then, add properties from config files:
  var files = ['mongo-config.json',
    'server-config.json',
    'authentication-config.json',
    'mailsender-config.json',
    'wikirepo-config.json',
    'activityresults-config.json',
    'crosssite-config.json',
    'ezmlm-config.json'];
  conf.addFiles(_.map(files, function (file) { return configdir + file; }));

  return conf;
}
module.exports = createConfiguration();

