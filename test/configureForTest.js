"use strict";
var nconf = require('../configure')();
var beans = require('CoolBeans');

nconf.set('port', '17125');

// sympa:
nconf.set('swkTrustedAppName', null);
nconf.set('swkTrustedAppPwd', null);
nconf.set('swkRemoteAppUser', null);

// beans:
nconf.set('beans', new beans('./config/testbeans.json'));


module.exports = nconf;
