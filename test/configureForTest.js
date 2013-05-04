"use strict";
var nconf = require('../configure')();
var beans = require('CoolBeans');
var fs = require('fs');

nconf.set('port', '17125');

// sympa:
nconf.set('swkTrustedAppName', null);
nconf.set('swkTrustedAppPwd', null);
nconf.set('swkRemoteAppUser', null);

// beans:
var productionBeans = require('../config/beans.json');
var testBeans = require('../config/testbeans.json');
for (var bean in testBeans) {
  productionBeans[bean] = testBeans[bean];
}
fs.writeFileSync('./test/tempbeans.json', JSON.stringify(productionBeans));

nconf.set('beans', new beans('./test/tempbeans.json'));

module.exports = nconf;
