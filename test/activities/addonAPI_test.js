"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

//var util = require('util');

var beans = require('../../testutil/configureForTest').get('beans');

var addonAPI = beans.get('addonAPI');
var activitystore = beans.get('activitystore');

var Activity = beans.get('activity');

describe('addon', function () {

  it('is never undefined', function (done) {
    sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, new Activity({})); });
    addonAPI.addonForMember(null, 'unknown member id', function (err, addon, addonConfig) {
      expect(addon).to.exist;
      expect(addonConfig).to.exist;
      done();
    });
  });

});

