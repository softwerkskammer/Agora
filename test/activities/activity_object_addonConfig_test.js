"use strict";

require('../../testutil/configureForTest');
var beans = require('nconf').get('beans');
var expect = require('chai').expect;

var Activity = beans.get('activity');
var AddonConfig = beans.get('addon').AddonConfig;

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
