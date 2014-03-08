"use strict";

require('../../testutil/configureForTest');
var beans = require('nconf').get('beans');
var expect = require('chai').expect;

var Activity = beans.get('activity');

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

describe('Activity\'s Addon for Member', function () {
  var addonOne = {homeAddress: 'homeOne'};
  var addonTwo = {homeAddress: 'homeTwo'};

  it('is never undefined', function () {
    var activity = new Activity();
    expect(activity.addonForMember('memberOne')).to.exist;
  });


  it('is finds the right addon', function () {
    var activity = new Activity({ _addons: {memberOne: addonOne, memberTwo: addonTwo} });
    expect(activity.addonForMember('memberOne').homeAddress()).to.equal(addonOne.homeAddress);
  });
  
});
