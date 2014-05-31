'use strict';

var nconf = require('nconf');
var moment = require('moment-timezone');


function PaymentInfo(amount) {
  this.state = {amount: parseInt(amount, 10)};
  return this;
}

PaymentInfo.prototype.amount = function () {
  return this.state.amount; // net amount
};

PaymentInfo.prototype.stripeTotal = function () {
  return parseFloat(((this.amount() + 0.3) / 0.971).toFixed(2)); // what will be billed via credit card
};

PaymentInfo.prototype.fee = function () {
  return this.stripeTotal() - this.amount(); // fee for Stripe
};

PaymentInfo.prototype.bic = function () {
  return nconf.get('paymentBic');
};

PaymentInfo.prototype.iban = function () {
  return nconf.get('paymentIban');
};

PaymentInfo.prototype.paymentReceiver = function () {
  return nconf.get('paymentReceiver');
};

PaymentInfo.prototype.title = function () {
  return 'title';
};

PaymentInfo.prototype.moneyTransferred = function () {
  return this.state.moneyTransferred;
};

PaymentInfo.prototype.creditCardPaid = function () {
  return this.state.creditCardPaid;
};

PaymentInfo.prototype.moneyTransferredMoment = function () {
  return this.state.moneyTransferred && moment(this.state.moneyTransferred);
};

PaymentInfo.prototype.creditCardPaidMoment = function () {
  return this.state.creditCardPaid && moment(this.state.creditCardPaid);
};

PaymentInfo.prototype.paymentReceivedMoment = function () {
  return this.state.paymentReceived && moment(this.state.paymentReceived);
};

PaymentInfo.prototype.paymentDone = function () {
  return !!(this.creditCardPaid() || this.moneyTransferred());
};

PaymentInfo.prototype.noteCreditCardPayment = function () {
  this.state.creditCardPaid = moment().toDate();
};

PaymentInfo.prototype.noteMoneyTransfer = function () {
  this.state.moneyTransferred = moment().toDate();
};

PaymentInfo.prototype.notePaymentReceived = function () {
  this.state.paymentReceived = moment().toDate();
};


module.exports = PaymentInfo;

