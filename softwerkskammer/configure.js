'use strict';

process.chdir(__dirname);
var nconf = require('nconf');
var Beans = require('CoolBeans');

function createConfiguration() {
// create an nconf object, and initialize it with given values from
// the environment variables and/or from the command line
  nconf.argv().env();
  var configdir = '../config/';
  nconf.file('mongo', configdir + 'mongo-config.json');
  nconf.file('sympa', configdir + 'sympa-config.json');
  nconf.file('server', configdir + 'server-config.json');
  nconf.file('authentication', configdir + 'authentication-config.json');
  nconf.file('mail', configdir + 'mailsender-config.json');
  nconf.file('wiki', configdir + 'wikirepo-config.json');
  nconf.file('gallery', configdir + 'gallery-config.json');
  nconf.file('activityresults', configdir + 'activityresults-config.json');
  nconf.defaults({
    adminListName: "admins",
    port: '17124',
    imageDirectory: "/tmp",
    mongoURL: 'mongodb://localhost:27017/swk',
    publicUrlPrefix: 'http://localhost:17124',
    securedByLoginURLPattern:
      '/activityresults|' +
      '/gallery|' +
      '/mailsender|' +
      '/members|' +
      '/new|' +
      '/edit|' +
      '/submit|' +
      '(subscribe|unsubscribe)/|' +
      '/mailarchive|' +
      '/invitation|' +
      '/addToWaitinglist|' +
      '/removeFromWaitinglist|' +
      '/addon|' +
      '/submitAddon|' +
      '/wiki/socrates.*/|' +
      '/payment|' +
      'dashboard',
    secret: 'secret',
    beans: new Beans(configdir + 'beans.json'),
    domainname: 'localhost'
  });

  return nconf;
}
module.exports = createConfiguration();

