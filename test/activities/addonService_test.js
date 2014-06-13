'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTest').get('beans');

var addonService = beans.get('addonService');
var stripeService = beans.get('stripeService');
var memberstore = beans.get('memberstore');
var activitystore = beans.get('activitystore');

var Activity = beans.get('activity');
var Member = beans.get('member');

describe('Addon Service', function () {

  var savedActivity;

  beforeEach(function () {
    sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, new Activity({title: 'Expensive Activity', _addonConfig: {deposit: 50}})); });
    sinon.stub(memberstore, 'getMemberForId', function (id, callback) { callback(null, new Member({firstname: 'Hans', lastname: 'Dampf', nickname: 'hada'})); });

    savedActivity = null;
    sinon.stub(activitystore, 'saveActivity', function (activity, callback) {
      savedActivity = activity;
      callback(null);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('addon and addonConfig are never undefined', function (done) {
    addonService.addonForMember(null, 'unknown member id', function (err, addon, addonConfig) {
      expect(addon).to.exist();
      expect(addonConfig).to.exist();
      done();
    });
  });

  it('saveAddon enhances activity with UI input and saves it', function (done) {
    var uiInputObject = { homeAddress: 'At home', billingAddress: 'At work', tShirtSize: 'XL', roommate: 'My best friend' };
    addonService.saveAddon('activity', 'member', uiInputObject, function (err) {
      expect(savedActivity.addonForMember('member').homeAddress()).to.equal('At home');
      expect(savedActivity.addonForMember('member').billingAddress()).to.equal('At work');
      expect(savedActivity.addonForMember('member').tShirtSize()).to.equal('XL');
      expect(savedActivity.addonForMember('member').roommate()).to.equal('My best friend');
      done(err);
    });
  });

  it('payWithTransfer enhances activity with money transfer info and saves it', function (done) {
    addonService.payWithTransfer('activity', 'member', function (err) {
      expect(savedActivity.addonForMember('member').moneyTransferred()).to.be.truthy();
      expect(savedActivity.addonForMember('member').creditCardPaid()).to.be.falsy();
      done(err);
    });
  });

  it('payWithCreditCard sets a description into the charge sent to stripe', function (done) {
    var chargeCreate = sinon.spy(function (charge, callback) {callback(null, charge); });
    sinon.stub(stripeService, 'transaction', function () { return { charges: { create: chargeCreate}}; });

    addonService.payWithCreditCard('activity', 10, 'member', 'stripe-id', 'D-Scription', function (err, message) {
      expect(chargeCreate.args[0][0].description).to.contain('D-Scription');
      done(err);
    });
  });

  it('payWithCreditCard enhances activity with money transfer info and saves it', function (done) {
    sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback(null, charge); }}}; });

    addonService.payWithCreditCard('activity', 10, 'member', 'stripe-id', '', function (err, message) {
      expect(savedActivity.addonForMember('member').moneyTransferred()).to.be.falsy();
      expect(savedActivity.addonForMember('member').creditCardPaid()).to.be.truthy();
      expect(message).to.exist();
      expect(err).to.not.exist();
      done(err);
    });
  });

  it('payWithCreditCard shows a status message if the returned error contains a message', function (done) {
    sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({message: 'General problem'}); }}}; });

    addonService.payWithCreditCard('activity', 10, 'member', 'stripe-id', '', function (err, message) {
      expect(savedActivity).to.be(null);
      expect(message).to.exist();
      expect(message.contents().type).to.equal('alert-danger');
      expect(err).to.not.exist();
      done(err);
    });
  });

  it('payWithCreditCard shows a normal error if the returned error contains no message', function (done) {
    sinon.stub(stripeService, 'transaction', function () { return { charges: { create: function (charge, callback) {callback({}); }}}; });

    addonService.payWithCreditCard('activity', 10, 'member', 'stripe-id', '', function (err, message) {
      expect(savedActivity).to.be(null);
      expect(message).to.not.exist();
      expect(err).to.exist();
      done(); // error case - do not pass error to done()
    });
  });

  describe('- tshirtSizes -', function () {
    it('returns an empty object if no lines are given', function () {
      expect(addonService.tshirtSizes([])).to.exist();
      expect(Object.keys(addonService.tshirtSizes([])).length).to.be(0);
    });

    it('returns one t-shirt-size if one line is given', function () {
      var addonLines = [ {addon: {tShirtSize: function () {return 'XXL'; }}} ];
      expect(Object.keys(addonService.tshirtSizes(addonLines)).length).to.be(1);
      expect(addonService.tshirtSizes(addonLines).XXL.size).to.be('XXL');
      expect(addonService.tshirtSizes(addonLines).XXL.count).to.be(1);
    });

    it('returns an empty t-shirt-size an empty one is given', function () {
      var addonLines = [
        {addon: {tShirtSize: function () {return ''; }}}
      ];
      expect(Object.keys(addonService.tshirtSizes(addonLines)).length).to.be(1);
      expect(addonService.tshirtSizes(addonLines)[''].size).to.be('');
      expect(addonService.tshirtSizes(addonLines)[''].count).to.be(1);
    });

    it('returns the sums of the t-shirt-sizes if multiple are given', function () {
      var addonLines = [
        {addon: {tShirtSize: function () {return 'S'; }}},
        {addon: {tShirtSize: function () {return 'S'; }}},
        {addon: {tShirtSize: function () {return 'M'; }}},
        {addon: {tShirtSize: function () {return 'M'; }}},
        {addon: {tShirtSize: function () {return 'M'; }}},
        {addon: {tShirtSize: function () {return 'L'; }}}
      ];
      expect(Object.keys(addonService.tshirtSizes(addonLines)).length).to.be(3);
      expect(addonService.tshirtSizes(addonLines).S.size).to.be('S');
      expect(addonService.tshirtSizes(addonLines).S.count).to.be(2);
      expect(addonService.tshirtSizes(addonLines).M.size).to.be('M');
      expect(addonService.tshirtSizes(addonLines).M.count).to.be(3);
      expect(addonService.tshirtSizes(addonLines).L.size).to.be('L');
      expect(addonService.tshirtSizes(addonLines).L.count).to.be(1);
    });
  });
});

