"use strict";

process.chdir(__dirname);

var nconf = require('nconf');

// create an nconf object, and initialize it with given values from
// the environment variables and/or from the command line
nconf.argv().env();
nconf.defaults({
  'port': '17124',
  'appname': 'dummyapp',
  'apppassword': 'dummypwd',
  'remoteAppUser': 'dummyuser'
});

var app = require('./app.js')(nconf);
app.start();