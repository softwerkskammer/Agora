'use strict';

// we need to expose the core in order to stub that during automated tests
var transport = require('nodemailer').createTransport(require('simple-configure').get('transport-options'));

module.exports = {
  transport: transport
};
