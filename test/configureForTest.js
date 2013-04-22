"use strict";
var nconf = require('../configure')();

nconf.set('port', '17125');

// sympa:
nconf.set('swkTrustedAppName', null);
nconf.set('swkTrustedAppPwd', null);
nconf.set('swkRemoteAppUser', null);

module.exports = nconf;
