"use strict";

var app = require('./app.js');
var port = process.argv[2] || 17124;

app.start(port);
