"use strict";
var nconf = require('../configure')();

nconf.set('port', '17125');

module.exports = nconf;
