'use strict';
var _ = require('lodash');
var winston = require('winston');
var conf = require('nconf');
var logger = winston.loggers.get('application');
var async = require('async');

var beans = conf.get('beans');
var PaymentInfo = beans.get('paymentInfo');
var misc = beans.get('misc');

module.exports = {
  getPaymentInfo: function (amount, callback) {
    callback(null, new PaymentInfo(amount));
  }
};