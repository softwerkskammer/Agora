"use strict";

process.chdir(__dirname);

var nconf = require('nconf');
var app = require('./app.js');

nconf.argv().env();
nconf.defaults({
  'port': '17124'
});

app.start(nconf);