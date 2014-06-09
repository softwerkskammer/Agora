'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTest').get('beans');

var paymentService = beans.get('paymentService');
var stripeAPI = beans.get('stripeAPI');
var memberstore = beans.get('memberstore');
var Member = beans.get('member');

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
      sinon.stub(memberstore, 'getMemberForId', function (id, callback) { callback(null, new Member({firstname: 'Hans', lastname: 'Dampf', nickname: 'hada'})); });
    });

    it('executes save callback', function (done) {
      sinon.stub(stripeAPI, 'transaction', function () { return { charges: { create: function (charge, callback) {callback(null, charge); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
        expect(invoked).to.be.true();
        expect(message).to.exist();
        expect(err).to.not.exist();
        done(err);
      });
    });

    it('shows a status message if the returned error contains a message', function (done) {
      sinon.stub(stripeAPI, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({message: 'General problem'}); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
        expect(invoked).to.be.false();
        expect(message).to.exist();
        expect(message.contents().type).to.equal('alert-danger');
        expect(err).to.not.exist();
        done(err);
      });
    });

    it('shows a normal error if the returned error contains no message', function (done) {
      sinon.stub(stripeAPI, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, 100, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
        expect(invoked).to.be.false();
        expect(message).to.not.exist();
        expect(err).to.exist();
        done(); // error case - do not pass error to done()
      });
    });

    it('shows a normal error if the method is invoked with amount being NaN', function (done) {
      sinon.stub(stripeAPI, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, NaN, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
        expect(invoked).to.be.false();
        expect(message).to.not.exist();
        expect(err).to.exist();
        expect(err.message).to.be.undefined();
        done(); // error case - do not pass error to done()
      });
    });

    it('shows a normal error if the method is invoked with amount being undefined', function (done) {
      sinon.stub(stripeAPI, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, undefined, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
        expect(invoked).to.be.false();
        expect(message).to.not.exist();
        expect(err).to.exist();
        expect(err.message).to.be.undefined();
        done(); // error case - do not pass error to done()
      });
    });

    it('shows a normal error if the method is invoked with amount being null', function (done) {
      sinon.stub(stripeAPI, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

      paymentService.payWithCreditCard(saveCreditCardPayment, null, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
        expect(invoked).to.be.false();
        expect(message).to.not.exist();
        expect(err).to.exist();
        expect(err.message).to.be.undefined();
        done(); // error case - do not pass error to done()
      });
    });
  });

  describe('Payment with credit card where member loading', function () {
    it('does not return a member: ', function (done) {
      sinon.stub(memberstore, 'getMemberForId', function (id, callback) { callback(null); });

      paymentService.payWithCreditCard(null, 100, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
        expect(message).to.not.exist();
        expect(err).to.not.exist();
        done(err);
      });
    });

    it('yields an error: ', function (done) {
      sinon.stub(memberstore, 'getMemberForId', function (id, callback) { callback(new Error('Member loading error')); });

      paymentService.payWithCreditCard(null, 100, 'Credit Card Payment', 'member', 'stripe-id', function (err, message) {
        expect(message).to.not.exist();
        expect(err).to.exist();
        expect(err.message).to.be('Member loading error');
        done(); // error case - do not pass error to done()
      });
    });
  });

  describe('Fee Calculation', function () {
    it('returns the correct fee for valid inputs', function () {
      expect(paymentService.calcFee(100)).to.be(3.2955715756951633);
      expect(paymentService.calcFee(600.55)).to.be(18.245056642636428);
      expect(paymentService.calcFee(12345)).to.be(369.00617919670367);
    });

    it('returns rubbish for some kinds of invalid inputs', function () {
      expect(paymentService.calcFee('100')).to.be(930.1750772399587);
      expect(paymentService.calcFee(false)).to.be(0.30895983522142123);
      expect(paymentService.calcFee(null)).to.be(0.30895983522142123);
    });

    it('returns NaN for other kinds of invalid inputs', function () {
      expect(isNaN(paymentService.calcFee('abc'))).to.be.true();
      expect(isNaN(paymentService.calcFee(undefined))).to.be.true();
    });
  });

});

