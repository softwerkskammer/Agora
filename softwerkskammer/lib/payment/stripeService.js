'use strict';

const stripe = require('stripe');
const conf = require('simple-configure');

module.exports = {

  transaction: function transaction() {
    return stripe(conf.get('secretPaymentKey'));
  }

};
