/*jslint stupid: true */
"use strict";
var nconf = require('../configure');
var Beans = require('CoolBeans');
var fs = require('fs');

nconf.set('port', '17125');

require('./shutupWinston')();

// sympa:
nconf.set('swkTrustedAppName', null);
nconf.set('swkTrustedAppPwd', null);
nconf.set('swkRemoteAppUser', null);

nconf.set('dontUsePersistentSessions', true);

nconf.set('superuser', ['superuserID']);

// beans:
var productionBeans = require('../config/beans.json');
var testBeans = require('../config/testbeansWithDB.json');
var bean;
for (bean in testBeans) {
  if (testBeans.hasOwnProperty(bean)) {
    productionBeans[bean] = testBeans[bean];
  }
}
fs.writeFileSync('./testutil/tempbeansWithDB.json', JSON.stringify(productionBeans));

nconf.set('beans', new Beans('./testutil/tempbeansWithDB.json'));

module.exports = nconf;
