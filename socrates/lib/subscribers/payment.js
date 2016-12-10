'use strict';

const moment = require('moment-timezone');

class Payment {
  constructor(object) {
    this.state = object || {}; // this must be *the* object that is referenced by subscriber.state._payment
  }

  moneyTransferred() {
    return this.state.moneyTransferred;
  }

  creditCardPaid() {
    return this.state.creditCardPaid;
  }

  moneyTransferredMoment() {
    return this.state.moneyTransferred && moment(this.state.moneyTransferred);
  }

  creditCardPaidMoment() {
    return this.state.creditCardPaid && moment(this.state.creditCardPaid);
  }

  paymentReceivedMoment() {
    return this.state.paymentReceived && moment(this.state.paymentReceived);
  }

  paymentDone() {
    return !!(this.creditCardPaid() || this.moneyTransferred());
  }

  paymentConfirmed() {
    return !!this.state.paymentReceived;
  }

  noteCreditCardPayment() {
    this.state.creditCardPaid = moment().toDate();
  }

  noteMoneyTransfer() {
    this.state.moneyTransferred = moment().toDate();
  }

  notePaymentReceived() {
    this.state.paymentReceived = moment().toDate();
  }
}

module.exports = Payment;
