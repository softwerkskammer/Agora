/*jslint stupid: true */
'use strict';

module.exports = function (testBeansFilename) {

  var nconf = require('../configure');
  var merge = require('utils-merge');
  var Beans = require('CoolBeans');
  nconf.set('port', '17125');

  require('./shutupWinston')();

  // sympa:
  nconf.set('swkTrustedAppName', null);
  nconf.set('swkTrustedAppPwd', null);
  nconf.set('swkRemoteAppUser', null);

  nconf.set('dontUsePersistentSessions', true);

  nconf.set('superuser', ['superuserID']);

  //wiki:
  nconf.set('wikipath', '.');

  // beans:
  var productionBeans = require('../config/beans.json');
  var testBeans = require('../config/' + testBeansFilename);
  merge(productionBeans, testBeans);

  nconf.set('beans', new Beans(productionBeans));

  return nconf;

};
