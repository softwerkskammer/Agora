'use strict';
var _ = require('lodash');
var conf = require('nconf');
var logger = require('winston').loggers.get('application');
var async = require('async');

var beans = conf.get('beans');
var PaymentInfo = beans.get('paymentInfo');
var misc = beans.get('misc');
var memberstore = beans.get('memberstore');
var statusmessage = beans.get('statusmessage');
var stripeService = beans.get('stripeService');
var fieldHelpers = beans.get('fieldHelpers');

var calcFee = function (amount) {
  var fee = ((amount + 0.3) / 0.971) - amount;
  return fieldHelpers.roundNumber(fee);
};

module.exports = {
  getPaymentInfo: function (callback) {
    callback(null, new PaymentInfo({}));
  },

  payWithCreditCard: function (saveCreditCardPayment, netAmount, description, memberId, stripeId, callback) {
    memberstore.getMemberForId(memberId, function (err, member) {
      if (err || !member) { return callback(err); }

      var totalAmount = parseInt((netAmount + calcFee(netAmount)) * 100, 10);
      var charge = { amount: totalAmount, currency: 'EUR', card: stripeId,
        description: description + ' payment for ' + member.firstname() + ' ' + member.lastname() +
          ' (' + member.nickname() + ')'};
      stripeService.transaction().charges.create(charge, function (err, charge) {
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
  },

  calcFee: calcFee
};
