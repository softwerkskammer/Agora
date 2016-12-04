'use strict';

const request = require('supertest');
const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');
const paymentService = beans.get('paymentService');
const statusmessage = beans.get('statusmessage');

const createApp = require('../../testutil/testHelper')('paymentApp').createApp;

describe('Payment application', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('Fee calculation', () => {

    it('returns an empty string when the input is undefined', done => {
      request(createApp({id: 'user'}))
        .get('/calcFee/')
        .expect(200)
        .end((err, res) => {
          expect(res.text).to.be('');
          done(err);
        });
    });

    it('returns the fee in german locale with euro sign', done => {
      request(createApp({id: 'user'}))
        .get('/calcFee/100')
        .expect(200)
        .end((err, res) => {
          expect(res.text).to.be('3,30 €');
          done(err);
        });
    });
    it('returns the fee for 100 in german locale with euro sign', done => {
      request(createApp({id: 'user'}))
        .get('/calcFee/100')
        .expect(200)
        .end((err, res) => {
          expect(res.text).to.be('3,30 €');
          done(err);
        });
    });

    it('returns the fee for 600,55 in german locale with euro sign', done => {
      request(createApp({id: 'user'}))
        .get('/calcFee/600,55')
        .expect(200)
        .end((err, res) => {
          expect(res.text).to.be('18,25 €');
          done(err);
        });
    });

    it('accepts the amount with dot formatting', done => {
      request(createApp({id: 'user'}))
        .get('/calcFee/600.55')
        .expect(200)
        .end((err, res) => {
          expect(res.text).to.be('18,25 €');
          done(err);
        });
    });

    it('returns an empty string if the amount is 0', done => {
      request(createApp({id: 'user'}))
        .get('/calcFee/0')
        .expect(200)
        .end((err, res) => {
          expect(res.text).to.be('');
          done(err);
        });
    });
  });

  describe('Credit Card Payment', () => {

    let amount;

    beforeEach(() => {
      amount = undefined;
      sinon.stub(paymentService, 'payWithCreditCard', (saveCreditCardPayment, passedAmount, description, stripeId, callback) => {
        amount = passedAmount;
        const message = statusmessage.successMessage('message.title.save_successful', 'message.content.activities.credit_card_paid', {amount: passedAmount});
        callback(null, message);
      });
    });

    it('passes a float to the service method when a float with comma and Euro sign is posted', done => {
      request(createApp({id: 'user'}))
        .post('/submitCreditCard')
        .send('amount=100,23 €')
        .expect(302)
        .end(err => {
          expect(amount).to.be(100.23);
          done(err);
        });
    });

    it('passes a float to the service method when a float with dot and Euro sign is posted', done => {
      request(createApp({id: 'user'}))
        .post('/submitCreditCard')
        .send('amount=100.23 €')
        .expect(302)
        .end(err => {
          expect(amount).to.be(100.23);
          done(err);
        });
    });

    it('passes a float to the service method when an integer with Euro sign is posted', done => {
      request(createApp({id: 'user'}))
        .post('/submitCreditCard')
        .send('amount=100 €')
        .expect(302)
        .end(err => {
          expect(amount).to.be(100);
          done(err);
        });
    });

    it('passes NaN to the service method when the amount field is empty', done => {
      request(createApp({id: 'user'}))
        .post('/submitCreditCard')
        .send('amount=')
        .expect(302)
        .end(err => {
          expect(isNaN(amount)).to.be.true();
          done(err);
        });
    });

  });

});
