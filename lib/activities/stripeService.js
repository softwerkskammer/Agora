'use strict';

var stripe = require('stripe');
var conf = require('nconf');

module.exports = {

  transaction: function () {
    return stripe(conf.get('secretPaymentKey'));
  }

};
