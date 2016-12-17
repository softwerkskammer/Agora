'use strict';

const logger = require('winston').loggers.get('application');
const beans = require('simple-configure').get('beans');
const PaymentInfo = beans.get('paymentInfo');
const statusmessage = beans.get('statusmessage');
const stripeService = beans.get('stripeService');

function calcFee(amount) {
  return ((amount + 0.3) / 0.971) - amount;
}

module.exports = {
  getPaymentInfo: function getPaymentInfo(callback) {
    callback(null, new PaymentInfo({}));
  },

  payWithCreditCard: function payWithCreditCard(saveCreditCardPayment, netAmount, description, stripeId, callback) {
    const totalAmount = parseInt((netAmount + calcFee(netAmount)) * 100, 10);
    const charge = {amount: totalAmount, currency: 'EUR', card: stripeId, description};
    stripeService.transaction().charges.create(charge, (err1, charge1) => {
      if (err1) {
        logger.error('Error on payment: ' + err1.message + '. For: "' + description);
        if (err1.message) {
          return callback(null, statusmessage.errorMessage('message.title.problem', 'message.content.activities.credit_card_not_paid', {reason: err1.message}));
        }
        return callback(err1);
      }
      logger.info('Credit Card charged for: "' + description + ' Charge: ' + JSON.stringify(charge1));

      saveCreditCardPayment(err2 => {
        const displayAmount = (charge1.amount / 100).toFixed(2).replace('.', ',') + ' €';
        const message = statusmessage.successMessage('message.title.save_successful', 'message.content.activities.credit_card_paid', {amount: displayAmount});
        callback(err2, message);
      });
    });
  },

  calcFee
};
