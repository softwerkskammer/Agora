"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

//var util = require('util');

var beans = require('../../testutil/configureForTest').get('beans');

var addonAPI = beans.get('addonAPI');
var stripeAPI = beans.get('stripeAPI');
var membersAPI = beans.get('membersAPI');
var activitystore = beans.get('activitystore');

var Activity = beans.get('activity');
var Member = beans.get('member');

describe('Addon API', function () {

  var savedActivity;

  beforeEach(function () {
    sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, new Activity({title: "Expensive Activity", _addonConfig: {deposit: 50}})); });
    sinon.stub(membersAPI, 'getMemberForId', function (id, callback) { callback(null, new Member({firstname: 'Hans', lastname: 'Dampf', nickname: 'hada'})); });

    savedActivity = null;
    sinon.stub(activitystore, 'saveActivity', function (activity, callback) {
      savedActivity = activity;
      callback(null);
    });

    sinon.stub(stripeAPI, 'transaction', function () {
      return { charges: { create: function (charge, callback) {
        callback(null, charge);
      } } };
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('addon and addonConfig are never undefined', function (done) {
    addonAPI.addonForMember(null, 'unknown member id', function (err, addon, addonConfig) {
      expect(addon).to.exist;
      expect(addonConfig).to.exist;
      done();
    });
  });

  it('saveAddon enhances activity with UI input and saves it', function (done) {
    var uiInputObject = { homeAddress: 'At home', billingAddress: 'At work', tShirtSize: 'XL', roommate: 'My best friend' };
    addonAPI.saveAddon('activity', 'member', uiInputObject, function (err) {
      expect(savedActivity.addonForMember('member').homeAddress()).to.equal('At home');
      expect(savedActivity.addonForMember('member').billingAddress()).to.equal('At work');
      expect(savedActivity.addonForMember('member').tShirtSize()).to.equal('XL');
      expect(savedActivity.addonForMember('member').roommate()).to.equal('My best friend');
      done(err);
    });
  });

  it('payWithTransfer enhances activity with money transfer info and saves it', function (done) {
    addonAPI.payWithTransfer('activity', 'member', function (err) {
      expect(savedActivity.addonForMember('member').moneyTransferred()).to.be.truthy;
      expect(savedActivity.addonForMember('member').creditCardPaid()).to.be.falsy;
      done(err);
    });
  });

  it('payWithCreditCard enhances activity with money transfer info and saves it', function (done) {
    addonAPI.payWithCreditCard('activity', 'member', 'stripe-id', function (err, charge) {
      expect(savedActivity.addonForMember('member').moneyTransferred()).to.be.falsy;
      expect(savedActivity.addonForMember('member').creditCardPaid()).to.be.truthy;
      expect(charge.amount).to.equal(5180); // amount is in cents
      expect(charge.description).to.equal('Expensive Activity deposit for Hans Dampf (hada)');
      done(err);
    });
  });
});

