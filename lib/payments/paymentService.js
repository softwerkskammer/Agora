'use strict';
var _ = require('lodash');
var winston = require('winston');
var conf = require('nconf');
var logger = winston.loggers.get('application');
var async = require('async');

var beans = conf.get('beans');
var PaymentInfo = beans.get('paymentInfo');
var misc = beans.get('misc');
var memberstore = beans.get('memberstore');
var statusmessage = beans.get('statusmessage');
var stripeAPI = beans.get('stripeAPI');

module.exports = {
  getPaymentInfo: function (amount, callback) {
    callback(null, new PaymentInfo(amount));
  },

  payWithCreditCard: function (saveCreditCardPayment, netAmount, description, memberId, stripeId, callback) {
    var paymentInfo = new PaymentInfo(netAmount);
    memberstore.getMemberForId(memberId, function (err, member) {
      if (err || !member) { return callback(err); }

      var totalAmount = paymentInfo.stripeTotal();
      var charge = { amount: totalAmount * 100, currency: 'EUR', card: stripeId,
        description: paymentInfo.title() + ' payment for ' + member.firstname() + ' ' + member.lastname() +
          ' (' + member.nickname() + ')'};
      stripeAPI.transaction().charges.create(charge, function (err, charge) {
        if (err) {
          logger.error('Error on payment: ' + err.message + '. For: "' + description + '" and member "' + memberId + '".');
          if (err.message) {
            return callback(null, statusmessage.errorMessage('message.title.problem', 'message.content.activities.credit_card_not_paid', {reason: err.message}));
          }
          return callback(err);
        }
        logger.info('Credit Card charged for: "' + description + '" and member "' + memberId + '".' +
          'Charge: ' + JSON.stringify(charge));

        saveCreditCardPayment(function (err) {
          var displayAmount = (charge.amount / 100).toFixed(2).replace('.', ',') + ' €';
          var message = statusmessage.successMessage('message.title.save_successful', 'message.content.activities.credit_card_paid', {amount: displayAmount});
          callback(err, message);
        });
      });
    });
  }
  
};