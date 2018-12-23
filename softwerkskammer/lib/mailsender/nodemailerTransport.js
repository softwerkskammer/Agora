module.exports = require('nodemailer').createTransport(require('simple-configure').get('transport-options'));
