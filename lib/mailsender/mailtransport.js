'use strict';

module.exports = require('nodemailer').createTransport(require('nconf').get('transport-options'));
