"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

//var util = require('util');

var Activity = conf.get('beans').get('activity');

function checkResourceNames(activity, resourceName1, resourceName2) {
  if (resourceName2) {
    expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(2);
    expect(activity.resources().resourceNames(), "Name of resource").to.contain(resourceName1);
    expect(activity.resources().resourceNames(), "Name of resource").to.contain(resourceName2);
  } else {
    expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(1);
    expect(activity.resources().resourceNames(), "Name of resource").to.contain(resourceName1);
  }
}

describe('Activity (when filled from UI)', function () {

  it('creates a resource without limit', function (done) {
    var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: ""}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(0);
    done();
  });

  it('creates a resource with limit', function (done) {
    var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "10"}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
    done();
  });

  it('creates two resources with limits', function (done) {
    var activity = new Activity().fillFromUI({resources: {names: ["Einzelzimmer", "Doppelzimmer"], limits: ["10", "20"]}});

    checkResourceNames(activity, "Einzelzimmer", "Doppelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
    expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(20);
    done();
  });

  it('creates a resource without limit when the entered limit is negative', function (done) {
    var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "-10"}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(0);
    done();
  });

  it('creates a resource without limit when the entered limit is not an integer', function (done) {
    var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "dudu"}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(0);
    done();
  });


  it('adds a limit to a resource without limit', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
      .fillFromUI({resources: {names: "Einzelzimmer", limits: "10"}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
    done();
  });

  it('removes a limit from a resource with limit', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
      .fillFromUI({resources: {names: "Einzelzimmer", limits: ""}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(0);
    done();
  });

  it('removes a limit from a resource with limit when the new limit is negative', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
      .fillFromUI({resources: {names: "Einzelzimmer", limits: "-1"}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(0);
    done();
  });

  it('removes a limit from a resource with limit when the new limit is not an integer', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
      .fillFromUI({resources: {names: "Einzelzimmer", limits: "tuut"}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(0);
    done();
  });

  it('adds a limit to a resource with registered members', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId']}}})
      .fillFromUI({resources: {names: "Einzelzimmer", limits: "10"}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
    expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
    expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId');
    done();
  });

  it('removes a limit from a resource with registered members', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId'], limit: 10}}})
      .fillFromUI({resources: {names: "Einzelzimmer", limits: ""}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(0);
    expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
    expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId');
    done();
  });

  it('adds a limit to a resource with too many registered members', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId1', 'memberId2']}}})
      .fillFromUI({resources: {names: "Einzelzimmer", limits: "1"}});

    checkResourceNames(activity, "Einzelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(1);
    expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(2);
    expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId1');
    expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId2');
    done();
  });

  it('removes a resource without limit and without registered members', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
      .fillFromUI({resources: {names: "", limits: ""}});

    expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(0);
    done();
  });

  it('removes a resource with limit and without registered members', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
      .fillFromUI({resources: {names: "", limits: ""}});

    expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(0);
    done();
  });

  it('removes a resource with registered members', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId'], limit: 10}}})
      .fillFromUI({resources: {names: "", limits: ""}});

    expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(0);
    done();
  });

  it('removes a resource if only the limit is set and not the name', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId'], limit: 10}}})
      .fillFromUI({resources: {names: "", limits: "10"}});

    expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(0);
    done();
  });

  it('renames a resource without limit and without registered members', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
      .fillFromUI({resources: {names: "Doppelzimmer", limits: ""}});

    checkResourceNames(activity, "Doppelzimmer");
    expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(0);
    done();
  });

  it('renames a resource with limit and without registered members, changing the limit', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
      .fillFromUI({resources: {names: "Doppelzimmer", limits: "20"}});

    checkResourceNames(activity, "Doppelzimmer");
    expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(20);
    done();
  });

  it('renames a resource without limit and without registered members, adding a limit', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
      .fillFromUI({resources: {names: "Doppelzimmer", limits: "10"}});

    checkResourceNames(activity, "Doppelzimmer");
    expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(10);
    done();
  });

  it('renames a resource with registered members, changing the limit', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId'], limit: 10}}})
      .fillFromUI({resources: {names: "Doppelzimmer", limits: "20"}});

    checkResourceNames(activity, "Doppelzimmer");
    expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(20);
    expect(activity.resources().named("Doppelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
    expect(activity.resources().named("Doppelzimmer").registeredMembers(), "Members of resource").to.contain('memberId');
    done();
  });

  it('replaces one resource by removing one and adding a new one', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId1'], limit: 10},
      Doppelzimmer: {_registeredMembers: ['memberId2'], limit: 20}}})
      .fillFromUI({resources: {names: ["Einzelzimmer", "", "Schlafsaal"], limits: ["10", "20", "30"] }});

    checkResourceNames(activity, "Einzelzimmer", "Schlafsaal");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
    expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
    expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId1');
    expect(activity.resources().named("Schlafsaal").limit(), "Limit of resource").to.equal(30);
    expect(activity.resources().named("Schlafsaal").registeredMembers().length, "Member count of resource").to.equal(0);
    done();
  });

  it('replaces two resources by renaming one, removing the second and adding a new one', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId1'], limit: 10},
      Doppelzimmer: {_registeredMembers: ['memberId2'], limit: 20}}})
      .fillFromUI({resources: {names: ["Koje", "", "Schlafsaal"], limits: ["10", "20", "30"] }});

    checkResourceNames(activity, "Koje", "Schlafsaal");
    expect(activity.resources().named("Koje").limit(), "Limit of resource").to.equal(10);
    expect(activity.resources().named("Koje").registeredMembers().length, "Member count of resource").to.equal(1);
    expect(activity.resources().named("Koje").registeredMembers(), "Members of resource").to.contain('memberId1');
    expect(activity.resources().named("Schlafsaal").limit(), "Limit of resource").to.equal(30);
    expect(activity.resources().named("Schlafsaal").registeredMembers().length, "Member count of resource").to.equal(0);
    done();
  });

  it('exchanges the names of two resources with registered members when the resource order is changed', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: ['memberId1'], limit: 10},
      Doppelzimmer: {_registeredMembers: ['memberId2'], limit: 20}}})
      .fillFromUI({resources: {names: ["Doppelzimmer", "Einzelzimmer"], limits: ["10", "20"] }});

    checkResourceNames(activity, "Doppelzimmer", "Einzelzimmer");
    expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(10);
    expect(activity.resources().named("Doppelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
    expect(activity.resources().named("Doppelzimmer").registeredMembers(), "Members of resource").to.contain('memberId1');
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(20);
    expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
    expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId2');
    done();
  });


});
