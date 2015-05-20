'use strict';

var logger = require('winston').loggers.get('application');
var beans = require('simple-configure').get('beans');
var PaymentInfo = beans.get('paymentInfo');
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

  payWithCreditCard: function (saveCreditCardPayment, netAmount, description, stripeId, callback) {
    var totalAmount = parseInt((netAmount + calcFee(netAmount)) * 100, 10);
    var charge = {amount: totalAmount, currency: 'EUR', card: stripeId, description: description};
    stripeService.transaction().charges.create(charge, function (err1, charge1) {
      if (err1) {
        logger.error('Error on payment: ' + err1.message + '. For: "' + description);
        if (err1.message) {
          return callback(null, statusmessage.errorMessage('message.title.problem', 'message.content.activities.credit_card_not_paid', {reason: err1.message}));
        }
        return callback(err1);
      }
      logger.info('Credit Card charged for: "' + description + ' Charge: ' + JSON.stringify(charge1));

      saveCreditCardPayment(function (err2) {
        var displayAmount = (charge1.amount / 100).toFixed(2).replace('.', ',') + ' €';
        var message = statusmessage.successMessage('message.title.save_successful', 'message.content.activities.credit_card_paid', {amount: displayAmount});
        callback(err2, message);
      });
    });
  },

  calcFee: calcFee
};
