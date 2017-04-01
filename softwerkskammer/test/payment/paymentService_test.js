'use strict';

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');

const paymentService = beans.get('paymentService');
const stripeService = beans.get('stripeService');

describe('Payment Service', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('Payment with credit card', () => {
    let invoked;

    function saveCreditCardPayment(callback) {
      invoked = true;
      callback(null);
    }

    beforeEach(() => {
      invoked = false;
    });

    it('executes save callback', done => {
      sinon.stub(stripeService, 'transaction').callsFake(
        () => ({charges: {create: (charge, callback) => {callback(null, charge); }}})
      );

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'stripe-id', (err, message) => {
        expect(invoked).to.be.true();
        expect(message).to.exist();
        expect(err).to.not.exist();
        done(err);
      });
    });

    it('shows a status message if the returned error contains a message', done => {
      sinon.stub(stripeService, 'transaction').callsFake(
        () => ({charges: {create: (charge, callback) => {callback({message: 'General problem'}); }}})
      );

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'stripe-id', (err, message) => {
        expect(invoked).to.be.false();
        expect(message).to.exist();
        expect(message.contents().type).to.equal('alert-danger');
        expect(err).to.not.exist();
        done(err);
      });
    });

    it('shows a normal error if the returned error contains no message', done => {
      sinon.stub(stripeService, 'transaction').callsFake(() => ({charges: {create: (charge, callback) => {callback({}); }}}));

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'stripe-id', (err, message) => {
        expect(invoked).to.be.false();
        expect(message).to.not.exist();
        expect(err).to.exist();
        done(); // error case - do not pass error to done()
      });
    });

    /* TODO!
     it('shows a normal error if the method is invoked with amount being NaN', function (done) {
     sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

     paymentService.payWithCreditCard(saveCreditCardPayment, NaN, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
     expect(invoked).to.be.false();
     expect(message).to.not.exist();
     expect(err).to.exist();
     expect(err.message).to.be.undefined();
     done(); // error case - do not pass error to done()
     });
     });

     it('shows a normal error if the method is invoked with amount being undefined', function (done) {
     sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

     paymentService.payWithCreditCard(saveCreditCardPayment, undefined, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
     expect(invoked).to.be.false();
     expect(message).to.not.exist();
     expect(err).to.exist();
     expect(err.message).to.be.undefined();
     done(); // error case - do not pass error to done()
     });
     });
     */

    it('shows a normal error if the method is invoked with amount being null', done => {
      sinon.stub(stripeService, 'transaction').callsFake(() => ({charges: {create: (charge, callback) => {callback({}); }}}));

      paymentService.payWithCreditCard(saveCreditCardPayment, null, 'Credit Card Payment', 'stripe-id', (err, message) => {
        expect(invoked).to.be.false();
        expect(message).to.not.exist();
        expect(err).to.exist();
        expect(err.message).to.be.undefined();
        done(); // error case - do not pass error to done()
      });
    });
  });

  describe('Fee Calculation', () => {
    it('returns the correct fee for valid inputs, rounded to two digits', () => {
      expect(paymentService.calcFee(100)).to.be.between(3.29, 3.3);
      expect(paymentService.calcFee(600.55)).to.be.between(18.24, 18.25);
      expect(paymentService.calcFee(12345)).to.be.between(369, 369.01);
    });

    it('returns rubbish for some kinds of invalid inputs', () => {
      expect(paymentService.calcFee('100')).to.be.between(930.17, 930.18);
      expect(paymentService.calcFee(false)).to.be.between(0.3, 0.31);
      expect(paymentService.calcFee(null)).to.be.between(0.3, 0.31);
    });

    it('returns "NaN" for other kinds of invalid inputs', () => {
      expect(paymentService.calcFee('abc')).to.eql(NaN);
      expect(paymentService.calcFee(undefined)).to.eql(NaN);
    });
  });

});

