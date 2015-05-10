'use strict';

var conf = require('simple-configure');


function PaymentInfo(state) {
  this.state = state;
  return this;
}

PaymentInfo.prototype.bic = function () {
  return conf.get('paymentBic');
};

PaymentInfo.prototype.iban = function () {
  return conf.get('paymentIban');
};

PaymentInfo.prototype.paymentReceiver = function () {
  return conf.get('paymentReceiver');
};


PaymentInfo.prototype.paymentKey = function () {
  return conf.get('publicPaymentKey');
};


PaymentInfo.prototype.moneyTransferred = function () {
  return this.state.moneyTransferred;
};

PaymentInfo.prototype.creditCardPaid = function () {
  return this.state.creditCardPaid;
};

PaymentInfo.prototype.paymentDone = function () {
  return !!(this.creditCardPaid() || this.moneyTransferred());
};


module.exports = PaymentInfo;

