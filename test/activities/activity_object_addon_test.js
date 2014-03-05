"use strict";

require('../configureForTest');
var beans = require('nconf').get('beans');
var expect = require('chai').expect;

var Activity = beans.get('activity');

describe('Activity\'s Addon Configuration', function () {

  it('includes the assigned group of the activity for rendering purposes', function () {
    var activity = new Activity({ assignedGroup: 'group' });
    expect(activity.addonConfig().group).to.equal('group');
  });

  it('answers false if questioned for existence when not existing', function () {
    var activity = new Activity({ assignedGroup: 'group' });
    expect(activity.hasAddonConfig()).to.be.false;
  });

  it('answers true if questioned for existence when existing', function () {
    var activity = new Activity({ _addonConfig: {}, assignedGroup: 'group' });
    expect(activity.hasAddonConfig()).to.be.true;
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
