'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTest').get('beans');
var paymentService = beans.get('paymentService');
var statusmessage = beans.get('statusmessage');

var createApp = require('../../testutil/testHelper')('paymentApp').createApp;

describe('Payment application', function () {

  afterEach(function () {
    sinon.restore();
  });

  describe('Fee calculation', function () {

    it('returns an empty string when the input is undefined', function (done) {
      request(createApp({id: 'user'}))
        .get('/calcFee/')
        .expect(200)
        .end(function (err, res) {
          expect(res.text).to.be('');
          done(err);
        });
    });

    it('returns the fee in german locale with euro sign', function (done) {
      request(createApp({id: 'user'}))
        .get('/calcFee/100')
        .expect(200)
        .end(function (err, res) {
          expect(res.text).to.be('3,30 €');
          done(err);
        });
    });
    it('returns the fee for 100 in german locale with euro sign', function (done) {
      request(createApp({id: 'user'}))
        .get('/calcFee/100')
        .expect(200)
        .end(function (err, res) {
          expect(res.text).to.be('3,30 €');
          done(err);
        });
    });

    it('returns the fee for 600,55 in german locale with euro sign', function (done) {
      request(createApp({id: 'user'}))
        .get('/calcFee/600,55')
        .expect(200)
        .end(function (err, res) {
          expect(res.text).to.be('18,25 €');
          done(err);
        });
    });

    it('accepts the amount with dot formatting', function (done) {
      request(createApp({id: 'user'}))
        .get('/calcFee/600.55')
        .expect(200)
        .end(function (err, res) {
          expect(res.text).to.be('18,25 €');
          done(err);
        });
    });

    it('returns an empty string if the amount is 0', function (done) {
      request(createApp({id: 'user'}))
        .get('/calcFee/0')
        .expect(200)
        .end(function (err, res) {
          expect(res.text).to.be('');
          done(err);
        });
    });
  });

  describe('Credit Card Payment', function () {

    var amount;

    beforeEach(function () {
      amount = undefined;
      sinon.stub(paymentService, 'payWithCreditCard', function (saveCreditCardPayment, passedAmount, description, stripeId, callback) {
        amount = passedAmount;
        var message = statusmessage.successMessage('message.title.save_successful', 'message.content.activities.credit_card_paid', {amount: passedAmount});
        callback(null, message);
      });
    });

    it('passes a float to the service method when a float with comma and Euro sign is posted', function (done) {
      request(createApp({id: 'user'}))
        .post('/submitCreditCard')
        .send('amount=100,23 €')
        .expect(302)
        .end(function (err) {
          expect(amount).to.be(100.23);
          done(err);
        });
    });

    it('passes a float to the service method when a float with dot and Euro sign is posted', function (done) {
      request(createApp({id: 'user'}))
        .post('/submitCreditCard')
        .send('amount=100.23 €')
        .expect(302)
        .end(function (err) {
          expect(amount).to.be(100.23);
          done(err);
        });
    });

    it('passes a float to the service method when an integer with Euro sign is posted', function (done) {
      request(createApp({id: 'user'}))
        .post('/submitCreditCard')
        .send('amount=100 €')
        .expect(302)
        .end(function (err) {
          expect(amount).to.be(100);
          done(err);
        });
    });

    it('passes NaN to the service method when the amount field is empty', function (done) {
      request(createApp({id: 'user'}))
        .post('/submitCreditCard')
        .send('amount=')
        .expect(302)
        .end(function (err) {
          expect(isNaN(amount)).to.be.true();
          done(err);
        });
    });

  });

});
