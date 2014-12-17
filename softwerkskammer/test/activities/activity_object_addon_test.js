'use strict';

require('../../testutil/configureForTest');
var beans = require('simple-configure').get('beans');
var expect = require('must');

var Activity = beans.get('activity');

describe('Activity\'s Addon for Member', function () {
  var addonOne = {homeAddress: 'homeOne'};
  var addonTwo = {homeAddress: 'homeTwo'};

  it('is never undefined', function () {
    var activity = new Activity();
    expect(activity.addonForMember('memberOne')).to.exist();
  });

  it('is finds the right addon', function () {
    var activity = new Activity({ _addons: {memberOne: addonOne, memberTwo: addonTwo} });
    expect(activity.addonForMember('memberOne').homeAddress()).to.equal(addonOne.homeAddress);
  });

});

describe('Activity knows about Addon information entered by member', function () {
  var addonOne = {homeAddress: 'homeOne'};
  var addonTwo = {homeAddress: 'homeOne', billingAddress: 'billingOne'};

  it('returns true if there is no addon configuration', function () {
    var activity = new Activity({ _addons: {memberOne: addonOne} });

    expect(activity.memberEnteredAddonInformation('memberOne')).to.be(true);
  });
  it('returns true if addon configuration is empty', function () {
    var activity = new Activity({ _addons: {memberOne: addonOne}, _addonConfig: {} });

    expect(activity.memberEnteredAddonInformation('memberOne')).to.be(true);
  });
  it('returns true if member filled in an optional field', function () {
    var activity = new Activity({ _addons: {memberOne: addonOne}, _addonConfig: {homeAddress: false} });

    expect(activity.memberEnteredAddonInformation('memberOne')).to.be(true);
  });
  it('returns true if member filled in all mandatory fields', function () {
    var activity = new Activity({ _addons: {memberOne: addonOne}, _addonConfig: {homeAddress: true} });

    expect(activity.memberEnteredAddonInformation('memberOne')).to.be(true);
  });
  it('returns false if member did not fill in all mandatory fields (1 of 2)', function () {
    var activity = new Activity({ _addons: {memberOne: addonOne}, _addonConfig: {homeAddress: true, billingAddress: true} });

    expect(activity.memberEnteredAddonInformation('memberOne')).to.be.falsy();
  });
  it('returns false if member did not fill in all mandatory fields (2 of 3)', function () {
    var activity = new Activity({ _addons: {memberOne: addonTwo}, _addonConfig: {homeAddress: true, billingAddress: true, tShirtSize: true} });

    expect(activity.memberEnteredAddonInformation('memberOne')).to.be.falsy();
  });
});

describe('Activity knows which members entered Addon information', function () {
  var addonOne = {homeAddress: 'homeOne'};
  var addonTwo = {homeAddress: 'homeOne', billingAddress: 'billingOne'};

  it('returns the members whose addon information has been stored', function () {
    var activity = new Activity({ _addons: {memberOne: addonOne, memberTwo: addonTwo} });

    expect(activity.memberIdsOfAddons().length).to.equal(2);
    expect(activity.memberIdsOfAddons()).to.contain('memberOne');
    expect(activity.memberIdsOfAddons()).to.contain('memberTwo');
  });
});
