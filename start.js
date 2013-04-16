"use strict";

var nconf = require("./configure")();

var app = require('./app.js')(nconf);
app.start();
