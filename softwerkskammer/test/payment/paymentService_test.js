'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');

var paymentService = beans.get('paymentService');
var stripeService = beans.get('stripeService');

describe('Payment Service', function () {

  afterEach(function () {
    sinon.restore();
  });

  describe('Payment with credit card', function () {
    var invoked;
    var saveCreditCardPayment = function (callback) {
      invoked = true;
      callback(null);
    };

    beforeEach(function () {
      invoked = false;
    });

    it('executes save callback', function (done) {
      sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback(null, charge); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'stripe-id', function (err, message) {
        expect(invoked).to.be.true();
        expect(message).to.exist();
        expect(err).to.not.exist();
        done(err);
      });
    });

    it('shows a status message if the returned error contains a message', function (done) {
      sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({message: 'General problem'}); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'stripe-id', function (err, message) {
        expect(invoked).to.be.false();
        expect(message).to.exist();
        expect(message.contents().type).to.equal('alert-danger');
        expect(err).to.not.exist();
        done(err);
      });
    });

    it('shows a normal error if the returned error contains no message', function (done) {
      sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'stripe-id', function (err, message) {
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

    it('shows a normal error if the method is invoked with amount being null', function (done) {
      sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, null, 'Credit Card Payment', 'stripe-id', function (err, message) {
        expect(invoked).to.be.false();
        expect(message).to.not.exist();
        expect(err).to.exist();
        expect(err.message).to.be.undefined();
        done(); // error case - do not pass error to done()
      });
    });
  });

  describe('Payment with credit card', function () {
    xit('does not require a member: ', function (done) {
      sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {
        callback(null); }}}; });

      paymentService.payWithCreditCard(null, 100, 'Credit Card Payment', 'stripe-id', function (err, message) {
        expect(message).to.exist();
        expect(err).to.not.exist();
        done(err);
      });
    });
  });

  describe('Fee Calculation', function () {
    it('returns the correct fee for valid inputs, rounded to two digits', function () {
      expect(paymentService.calcFee(100)).to.be(3.3);
      expect(paymentService.calcFee(600.55)).to.be(18.25);
      expect(paymentService.calcFee(12345)).to.be(369.01);
    });

    it('returns rubbish for some kinds of invalid inputs', function () {
      expect(paymentService.calcFee('100')).to.be(930.18);
      expect(paymentService.calcFee(false)).to.be(0.31);
      expect(paymentService.calcFee(null)).to.be(0.31);
    });

    //it('returns NaN for other kinds of invalid inputs', function () {
      // TODO!
      // expect(isNaN(paymentService.calcFee('abc'))).to.be.true();
      // expect(isNaN(paymentService.calcFee(undefined))).to.be.true();
    //});
  });

});

