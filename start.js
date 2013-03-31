"use strict";

process.chdir(__dirname);

var nconf = require('nconf');

// create an nconf object, and initialize it with given values from
// the environment variables and/or from the command line
nconf.argv().env();
nconf.file('mongo', './config/mongo-config.json');
nconf.file('sympa', './config/sympa-config.json');
nconf.file('server', './config/server-config.json');
nconf.defaults({
  port: '17124',
  mongoHost: 'localhost',
  mongoPort:  '27017',
  publicUrlPrefix: "http://localhost:17124",
  appUrl: "http://localhost:17124",
  secret: "secret"
});

var app = require('./app.js')(nconf);
app.start();