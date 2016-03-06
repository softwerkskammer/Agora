'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var moment = require('moment-timezone');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');

var subscriberstore = beans.get('subscriberstore');
var socratesConstants = beans.get('socratesConstants');
var stripeService = beans.get('stripeService');
var socratesActivitiesService = beans.get('socratesActivitiesService');

var Member = beans.get('member');
var Subscriber = beans.get('subscriber');
var createApp = require('../../testutil/testHelper')('socratesPaymentApp').createApp;

describe('SoCraTes payment application', function () {

  var appWithoutMember = request(createApp({middlewares: [userWithoutMember]}));

  var socratesMember = new Member({
    id: 'memberId',
    nickname: 'nini',
    email: 'x@y.com',
    site: 'http://my.blog',
    firstname: 'Petra',
    lastname: 'Meier',
    authentications: [],
    socratesOnly: true
  });
  var subscriber;
  var socratesSubscriber;

  var appWithSocratesMember;

  beforeEach(function () {

    subscriber = {
      id: 'memberId'
    };
    socratesSubscriber = new Subscriber(subscriber);
    appWithSocratesMember = request(createApp({user: {member: socratesMember, subscriber: socratesSubscriber}}));

    sinon.stub(stripeService, 'transaction', function () {
      return {
        charges: {
          create: function (charge, callback) {
            callback(null, {amount: charge.amount});
          }
        }
      };
    });

    sinon.stub(subscriberstore, 'saveSubscriber', function (s, callback) { callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('general payment page', function () {

    it('shows bank transfer information to unregistered visitors', function (done) {
      appWithoutMember
        .get('/')
        .expect(/Payment/)
        .expect(/BIC:/)
        .expect(/IBAN:/)
        .expect(/Receiver:/)
        .expect(200, done);
    });

    it('shows bank transfer information to subscribers', function (done) {
      appWithSocratesMember
        .get('/')
        .expect(/Payment/)
        .expect(/BIC:/)
        .expect(/IBAN:/)
        .expect(/Receiver:/)
        .expect(200, done);
    });

    it('shows a credit card payment form to unregistered visitors', function (done) {
      appWithoutMember
        .get('/')
        .expect(/Credit Card/)
        .expect(/Description:<\/label><input/)
        .expect(/Amount:<\/label><input/)
        .expect(/Handling fee:/)
        .expect(/Card number:<\/label><input/)
        .expect(/CVC code:<\/label><input/)
        .expect(/Valid until month:<\/label><input/)
        .expect(/Valid until year:<\/label><input/)
        .expect(/Charge my credit card<\/button>/)
        .expect(200, done);
    });

    it('shows a credit card payment form to subscribers', function (done) {
      appWithSocratesMember
        .get('/')
        .expect(/Credit Card/)
        .expect(/Description:<\/label><input/)
        .expect(/Amount:<\/label><input/)
        .expect(/Handling fee:/)
        .expect(/Card number:<\/label><input/)
        .expect(/CVC code:<\/label><input/)
        .expect(/Valid until month:<\/label><input/)
        .expect(/Valid until year:<\/label><input/)
        .expect(/Charge my credit card<\/button>/)
        .expect(200, done);
    });
  });

  describe('SoCraTes payment page', function () {

    it('is not visible to unregistered visitors', function (done) {
      appWithoutMember
        .get('/socrates')
        .expect(/404 - This page is missing/) // TODO
        .expect(404, done);
    });

    it('redirects to registration page if the subscriber does not participate in the current SoCraTes', function (done) {
      appWithSocratesMember
        .get('/socrates')
        .expect('location', '/registration')
        .expect(302, done);
    });

    it('shows bank transfer information and a confirmation button if the subscriber participates', function (done) {
      subscriber.participations = {};
      subscriber.participations[socratesConstants.currentYear] = {};

      appWithSocratesMember
        .get('/socrates')
        .expect(/Payment/)
        .expect(/Amount:<\/b><span class="amount pull-right">100,00 €/)
        .expect(/BIC:/)
        .expect(/IBAN:/)
        .expect(/Receiver:/)
        .expect(/I have transferred the money<\/button>/)
        .expect(200, done);
    });

    it('shows a credit card payment form if the subscriber participates', function (done) {
      subscriber.participations = {};
      subscriber.participations[socratesConstants.currentYear] = {};

      appWithSocratesMember
        .get('/socrates')
        .expect(/Credit Card/)
        .expect(/Amount:<\/b><span class="amount pull-right">100 €/)
        .expect(/Handling fee:<\/b><span class="fee pull-right">3\.30 €/)
        .expect(/Card number:<\/label><input/)
        .expect(/CVC code:<\/label><input/)
        .expect(/Valid until month:<\/label><input/)
        .expect(/Valid until year:<\/label><input/)
        .expect(/Charge my credit card<\/button>/)
        .expect(200, done);
    });

    it('shows a notification if the subscriber has already paid via money transfer', function (done) {
      subscriber.participations = {};
      subscriber.participations[socratesConstants.currentYear] = {payment: {moneyTransferred: moment().toDate()}};

      appWithSocratesMember
        .get('/socrates')
        .expect(/Payment/)
        .expect(/BIC:/)
        .expect(/IBAN:/)
        .expect(/Receiver:/)
        .expect(/Already Paid\./)
        .expect(/You have already paid\./)
        .expect(200, done);
    });

    it('shows a notification if the subscriber has already paid via credit card', function (done) {
      subscriber.participations = {};
      subscriber.participations[socratesConstants.currentYear] = {payment: {creditCardPaid: moment().toDate()}};

      appWithSocratesMember
        .get('/socrates')
        .expect(/Payment/)
        .expect(/BIC:/)
        .expect(/IBAN:/)
        .expect(/Receiver:/)
        .expect(/Already Paid\./)
        .expect(/You have already paid\./)
        .expect(200, done);
    });

  });

  describe('fee calculation API', function () {

    it('returns the credit card fee if an amount is given if a subscriber is logged in', function (done) {
      appWithSocratesMember
        .get('/calcFee/100')
        .expect('3.30 €')
        .expect(200, done);
    });

    it('returns the credit card fee if an amount is given if nobody is logged in', function (done) {
      appWithoutMember
        .get('/calcFee/100')
        .expect('3.30 €')
        .expect(200, done);
    });

    it('returns nothing if an amount is given if a subscriber is logged in', function (done) {
      appWithSocratesMember
        .get('/calcFee')
        .expect('')
        .expect(200, done);
    });

    it('returns nothing if an amount is given if nobody is logged in', function (done) {
      appWithoutMember
        .get('/calcFee')
        .expect('')
        .expect(200, done);
    });
  });

  describe('general credit card payment submission', function () {

    it('redirects to the homepage when nobody is logged in', function (done) {
      appWithoutMember
        .post('/submitCreditCard')
        .send('amount=100,00')
        .send('description=Generous donation')
        .send('stripeId=abcdefghijklm')
        .expect(302)
        .expect('location', '/', done);
    });

    it('redirects to the homepage when a subscriber is logged in', function (done) {
      appWithSocratesMember
        .post('/submitCreditCard')
        .send('amount=100,00')
        .send('description=Generous donation')
        .send('stripeId=abcdefghijklm')
        .expect(302)
        .expect('location', '/', done);
    });
  });

  describe('SoCraTes credit card payment submission', function () {

    it('returns a 404 when nobody is logged in', function (done) {
      appWithoutMember
        .post('/submitCreditCardSocrates')
        .send('amount=100,00')
        .send('description=Generous donation')
        .send('stripeId=abcdefghijklm')
        .expect(/404 - This page is missing\./)
        .expect(404, done);
    });

    it('redirects to the homepage when a subscriber is logged in', function (done) {
      appWithSocratesMember
        .post('/submitCreditCardSocrates')
        .send('amount=100,00')
        .send('description=Generous donation')
        .send('stripeId=abcdefghijklm')
        .expect(302)
        .expect('location', '/', done);
    });

  });

  describe('SoCraTes money transfer submission', function () {

    it('returns a 404 when nobody is logged in', function (done) {
      appWithoutMember
        .post('/submitTransferSocrates')
        .expect(/404 - This page is missing\./)
        .expect(404, done);
    });

    it('redirects to the homepage when a subscriber is logged in', function (done) {
      appWithSocratesMember
        .post('/submitTransferSocrates')
        .expect(302)
        .expect('location', '/', done);
    });

  });

});
