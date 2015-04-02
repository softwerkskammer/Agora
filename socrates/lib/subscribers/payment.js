'use strict';

var moment = require('moment-timezone');

function Payment(object) {
  this.state = object || {}; // this must be *the* object that is referenced by subscriber.state._payment
  return this;
}


Payment.prototype.moneyTransferred = function () {
  return this.state.moneyTransferred;
};

Payment.prototype.creditCardPaid = function () {
  return this.state.creditCardPaid;
};

Payment.prototype.moneyTransferredMoment = function () {
  return this.state.moneyTransferred && moment(this.state.moneyTransferred);
};

Payment.prototype.creditCardPaidMoment = function () {
  return this.state.creditCardPaid && moment(this.state.creditCardPaid);
};

Payment.prototype.paymentReceivedMoment = function () {
  return this.state.paymentReceived && moment(this.state.paymentReceived);
};

Payment.prototype.paymentDone = function () {
  return !!(this.creditCardPaid() || this.moneyTransferred());
};

Payment.prototype.noteCreditCardPayment = function () {
  this.state.creditCardPaid = moment().toDate();
};

Payment.prototype.noteMoneyTransfer = function () {
  this.state.moneyTransferred = moment().toDate();
};

Payment.prototype.notePaymentReceived = function () {
  this.state.paymentReceived = moment().toDate();
};

module.exports = Payment;
