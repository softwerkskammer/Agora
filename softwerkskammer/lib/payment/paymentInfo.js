'use strict';

const conf = require('simple-configure');


class PaymentInfo {
  constructor(state) {
    this.state = state;
  }

  bic() {
    return conf.get('paymentBic');
  }

  iban() {
    return conf.get('paymentIban');
  }

  paymentReceiver() {
    return conf.get('paymentReceiver');
  }

  paymentKey() {
    return conf.get('publicPaymentKey');
  }

  moneyTransferred() {
    return this.state.moneyTransferred;
  }

  creditCardPaid() {
    return this.state.creditCardPaid;
  }

  paymentDone() {
    return !!(this.creditCardPaid() || this.moneyTransferred());
  }
}

module.exports = PaymentInfo;

