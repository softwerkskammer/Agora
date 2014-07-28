'use strict';

var conf = require('nconf');
module.exports = require('nodemailer').createTransport(conf.get('transport'), conf.get('transport-options'));
