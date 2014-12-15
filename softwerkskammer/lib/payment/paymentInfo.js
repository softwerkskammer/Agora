'use strict';

var nconf = require('simple-configure');
var moment = require('moment-timezone');


function PaymentInfo(state) {
  this.state = state;
  return this;
}

PaymentInfo.prototype.bic = function () {
  return nconf.get('paymentBic');
};

PaymentInfo.prototype.iban = function () {
  return nconf.get('paymentIban');
};

PaymentInfo.prototype.paymentReceiver = function () {
  return nconf.get('paymentReceiver');
};


PaymentInfo.prototype.paymentKey = function () {
  return nconf.get('publicPaymentKey');
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

