"use strict";

require('../../testutil/configureForTest');
var moment = require('moment-timezone');
var expect = require('chai').expect;

var beans = require('nconf').get('beans');
var Activity = beans.get('activity');
var AddonConfig = beans.get('addon').AddonConfig;
var Addon = beans.get('addon').Addon;

describe('Activity\'s Addon Configuration', function () {

  it('answers false if questioned for existence when not existing', function () {
    var activity = new Activity({ });
    expect(activity.hasAddonConfig()).to.be.false;
  });

  it('answers true if questioned for existence when existing', function () {
    var activity = new Activity({ _addonConfig: {} });
    expect(activity.hasAddonConfig()).to.be.true;
  });

  it('adds the addonConfig edited from UI', function () {
    var activity = new Activity();
    expect(activity.hasAddonConfig()).to.be.false;
    activity.fillAddonConfig({homeAddress: 'home sweet home'});
    expect(activity.hasAddonConfig()).to.be.true;
  });

  it('adds the addonConfig edited from UI - even if only the information is filled', function () {
    var activity = new Activity();
    expect(activity.hasAddonConfig()).to.be.false;
    activity.fillAddonConfig({addonInformation: 'info'});
    expect(activity.hasAddonConfig()).to.be.true;
  });

  it('removes the addonConfig edited from UI', function () {
    var activity = new Activity({ _addonConfig: {} });
    expect(activity.hasAddonConfig()).to.be.true;
    activity.fillAddonConfig({});
    expect(activity.hasAddonConfig()).to.be.false;
  });

});

describe('Addon Configuration', function () {
  it('has a default deposit of 100 and a default fee of 3.2', function () {
    var addonConfig = new AddonConfig();
    expect(addonConfig.deposit()).to.equal(100);
    expect(addonConfig.fee()).to.equal(3.2);
  });

});

describe('Addon', function () {
  it('initially has no addresses, T-Shirt size or roommate', function () {
    var addon = new Addon();
    expect(addon.homeAddress()).to.be.undefined;
    expect(addon.billingAddress()).to.be.undefined;
    expect(addon.tShirtSize()).to.be.undefined;
    expect(addon.roommate()).to.be.undefined;
  });

  it('is filled from the UI', function () {
    var addon = new Addon();
    addon.fillFromUI({ homeAddress: "At home", billingAddress: "At work", tShirtSize: "XXXXL", roommate: "My best friend"});
    expect(addon.homeAddress()).to.equal("At home");
    expect(addon.billingAddress()).to.equal("At work");
    expect(addon.tShirtSize()).to.equal("XXXXL");
    expect(addon.roommate()).to.equal("My best friend");
  });

  it('does not change payments when filled from the UI', function () {
    var addon = new Addon({moneyTransferred: 1, creditCardPaid: 2});
    addon.fillFromUI({ homeAddress: "At home", billingAddress: "At work", tShirtSize: "XXXXL", roommate: "My best friend"});
    expect(addon.moneyTransferred()).to.equal(1);
    expect(addon.creditCardPaid()).to.equal(2);
  });

  it('sets money transfer to now', function () {
    var addon = new Addon();
    var earlier = moment().subtract(1, 'second');
    addon.noteMoneyTransfer();
    var later = moment().add(1, 'second');
    expect(earlier.isBefore(addon.moneyTransferred()), 'Earlier is before money transfer').to.be.true;
    expect(later.isAfter(addon.moneyTransferred()), 'Later is after money transfer').to.be.true;
  });

  it('sets credit card payment to now', function () {
    var addon = new Addon();
    var earlier = moment().subtract(1, 'second');
    addon.noteCreditCardPayment();
    var later = moment().add(1, 'second');
    expect(earlier.isBefore(addon.creditCardPaid()), 'Earlier is before credit card payment').to.be.true;
    expect(later.isAfter(addon.creditCardPaid()), 'Later is after credit card payment').to.be.true;
  });

  it('says that payment is done when money transfer was chosen', function () {
    var addon = new Addon();
    expect(addon.paymentDone()).to.be.false;

    addon.noteMoneyTransfer();
    expect(addon.paymentDone()).to.be.true;

    addon.noteCreditCardPayment();
    expect(addon.paymentDone()).to.be.true;
  });

  it('says that payment is done when credit card payment was chosen', function () {
    var addon = new Addon();
    expect(addon.paymentDone()).to.be.false;

    addon.noteCreditCardPayment();
    expect(addon.paymentDone()).to.be.true;

    addon.noteMoneyTransfer();
    expect(addon.paymentDone()).to.be.true;
  });


});
