"use strict";

process.chdir(__dirname);

var nconf = require('nconf');

// create an nconf object, and initialize it with given values from
// the environment variables and/or from the command line
nconf.argv().env();
nconf.defaults({
  'port': '17124',
  'swkTrustedAppName': 'dummyapp',
  'swkTrustedAppPwd': 'dummypwd',
  'swkRemoteAppUser': 'dummyuser'
});

var app = require('./app.js')(nconf);
app.start();