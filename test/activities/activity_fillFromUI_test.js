"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var util = require('util');

var Activity = conf.get('beans').get('activity');

describe('Activity (when filled from UI)', function () {
  it('creates a resource without limit', function (done) {
    var activity = new Activity().fillFromUI({resources: {names: "Ressource", limits: ""}});

    console.log(util.inspect(activity.resources()));
    expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(1);
    expect(activity.resources().resourceNames(), "Name of resource").to.contain("Ressource");
    expect(activity.resources().named("Ressource").limit(), "Limit of resource").to.equal(0);
    done();
  });

});
