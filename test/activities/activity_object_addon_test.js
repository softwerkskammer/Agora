"use strict";

require('../../testutil/configureForTest');
var beans = require('nconf').get('beans');
var expect = require('chai').expect;

var Activity = beans.get('activity');

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
