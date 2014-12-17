'use strict';

var stripe = require('stripe');
var conf = require('simple-configure');

module.exports = {

  transaction: function () {
    return stripe(conf.get('secretPaymentKey'));
  }

};
