"use strict";

process.chdir(__dirname);

var nconf = require('nconf');

// create an nconf object, and initialize it with given values from
// the environment variables and/or from the command line
nconf.argv().env();
nconf.file('mongo', './config/mongo-config.json');
nconf.file('sympa', './config/sympa-config.json');
nconf.file('server', './config/server-config.json');
nconf.file('authentication', './config/authentication-config.json');
nconf.file('winston', './config/winston-config.json');
nconf.defaults({
  port            : '17124',
  mongoHost       : 'localhost',
  mongoPort       : '27017',
  publicUrlPrefix : "http://localhost:17124",
  secret          : "secret",
  'logging': {
    'application': {
      'filename': 'log/server.log',
      'maxSize': '10485760',
      'maxFiles': '5',
      'consoleLevel': 'info',
      'fileLevel': 'info'
    },
    'http': {
      'filename': 'log/http.log',
      'maxSize': '10485760',
      'maxFiles': '5',
      'consoleLevel': 'warn',
      'fileLevel': 'info'
    }
  }
});

var app = require('./app.js')(nconf);
app.start();