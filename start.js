"use strict";

var express = require('express');
var site = require('./lib/site');
var events = require('./lib/events');
var app = express();
var port = 17124;

app.use('/', site);
app.use('/events', events);

app.listen(port);
console.log('Server running at port ' + port);

