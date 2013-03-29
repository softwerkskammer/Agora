"use strict";

process.chdir(__dirname);

var nconf = require('nconf');

nconf.argv().env();
nconf.defaults({
  'port': '17124'
});

var app = require('./app.js')(nconf);
app.start();