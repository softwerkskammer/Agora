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

  describe('creates a resource', function () {

    it('without limit', function (done) {
      var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "", previousNames: ""}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(undefined);
      done();
    });

    it('with limit 0', function (done) {
      var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "0", previousNames: ""}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(0);
      done();
    });

    it('with limit', function (done) {
      var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "10", previousNames: ""}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
      done();
    });

    it('without limit when the entered limit is negative', function (done) {
      var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "-10", previousNames: ""}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(undefined);
      done();
    });

    it('without limit when the entered limit is not an integer', function (done) {
      var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "dudu", previousNames: ""}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(undefined);
      done();
    });

    it('with open registration', function (done) {
      var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "dudu", previousNames: "", registrationOpen: "true"}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").registrationOpen(), "Registration at resource").to.equal(true);
      done();
    });

    it('with closed registration', function (done) {
      var activity = new Activity().fillFromUI({resources: {names: "Einzelzimmer", limits: "dudu", previousNames: "", registrationOpen: undefined}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").registrationOpen(), "Registration at resource").to.equal(false);
      done();
    });

  });

  it('creates two resources with limits', function (done) {
    var activity = new Activity().fillFromUI({resources: {names: ["Einzelzimmer", "Doppelzimmer"], limits: ["10", "20"], previousNames: ["", ""]}});

    checkResourceNames(activity, "Einzelzimmer", "Doppelzimmer");
    expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
    expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(20);
    done();
  });

  describe('adds a limit', function () {

    it('to a resource without limit', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
        .fillFromUI({resources: {names: "Einzelzimmer", limits: "10", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
      done();
    });

    it('to a resource with registered members', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ]}}})
        .fillFromUI({resources: {names: "Einzelzimmer", limits: "10", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
      expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
      expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId');
      done();
    });

    it('to a resource with too many registered members', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId1'},
        {memberId: 'memberId2'}
      ]}}})
        .fillFromUI({resources: {names: "Einzelzimmer", limits: "1", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(1);
      expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(2);
      expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId1');
      expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId2');
      done();
    });

  });

  describe('removes a limit', function () {

    it('from a resource with limit', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: "Einzelzimmer", limits: "", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(undefined);
      done();
    });

    it('from a resource with limit when the new limit is negative', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: "Einzelzimmer", limits: "-1", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(undefined);
      done();
    });

    it('from a resource with limit when the new limit is not an integer', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: "Einzelzimmer", limits: "tuut", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(undefined);
      done();
    });

    it('from a resource with registered members', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ], limit: 10}}})
        .fillFromUI({resources: {names: "Einzelzimmer", limits: "", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Einzelzimmer");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(undefined);
      expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
      expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId');
      done();
    });

  });

  describe('removes a resource', function () {

    it('without limit and without registered members', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
        .fillFromUI({resources: {names: "", limits: "", previousNames: "Einzelzimmer"}});

      expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(0);
      done();
    });

    it('with limit and without registered members', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: "", limits: "", previousNames: "Einzelzimmer"}});

      expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(0);
      done();
    });

    it('with limit and with registered members', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ], limit: 10}}})
        .fillFromUI({resources: {names: "", limits: "", previousNames: "Einzelzimmer"}});

      expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(0);
      done();
    });

    it('if only the limit is set and not the name', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ], limit: 10}}})
        .fillFromUI({resources: {names: "", limits: "10", previousNames: "Einzelzimmer"}});

      expect(activity.resources().resourceNames().length, "Number of resource names").to.equal(0);
      done();
    });

  });

  describe('renames a resource', function () {

    it('without limit and without registered members', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
        .fillFromUI({resources: {names: "Doppelzimmer", limits: "", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Doppelzimmer");
      expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(undefined);
      done();
    });

    it('with limit and without registered members, changing the limit', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: "Doppelzimmer", limits: "20", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Doppelzimmer");
      expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(20);
      done();
    });

    it('without limit and without registered members, adding a limit', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
        .fillFromUI({resources: {names: "Doppelzimmer", limits: "10", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Doppelzimmer");
      expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(10);
      done();
    });

    it('with registered members, changing the limit', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ], limit: 10}}})
        .fillFromUI({resources: {names: "Doppelzimmer", limits: "20", previousNames: "Einzelzimmer"}});

      checkResourceNames(activity, "Doppelzimmer");
      expect(activity.resources().named("Doppelzimmer").limit(), "Limit of resource").to.equal(20);
      expect(activity.resources().named("Doppelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
      expect(activity.resources().named("Doppelzimmer").registeredMembers(), "Members of resource").to.contain('memberId');
      done();
    });

  });

  describe('replaces', function () {

    it('one resource by removing one and adding a new one', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId1'}
      ], limit: 10},
        Doppelzimmer: {_registeredMembers: ['memberId2'], limit: 20}}})
        .fillFromUI({resources: {names: ["Einzelzimmer", "", "Schlafsaal"], limits: ["10", "20", "30"], previousNames: ["Einzelzimmer", "Doppelzimmer", ""] }});

      checkResourceNames(activity, "Einzelzimmer", "Schlafsaal");
      expect(activity.resources().named("Einzelzimmer").limit(), "Limit of resource").to.equal(10);
      expect(activity.resources().named("Einzelzimmer").registeredMembers().length, "Member count of resource").to.equal(1);
      expect(activity.resources().named("Einzelzimmer").registeredMembers(), "Members of resource").to.contain('memberId1');
      expect(activity.resources().named("Schlafsaal").limit(), "Limit of resource").to.equal(30);
      expect(activity.resources().named("Schlafsaal").registeredMembers().length, "Member count of resource").to.equal(0);
      done();
    });

    it('two resources by renaming one, removing the second and adding a new one', function (done) {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId1'}
      ], limit: 10},
        Doppelzimmer: {_registeredMembers: ['memberId2'], limit: 20}}})
        .fillFromUI({resources: {names: ["Koje", "", "Schlafsaal"], limits: ["10", "20", "30"], previousNames: ["Einzelzimmer", "Doppelzimmer", ""] }});

      checkResourceNames(activity, "Koje", "Schlafsaal");
      expect(activity.resources().named("Koje").limit(), "Limit of resource").to.equal(10);
      expect(activity.resources().named("Koje").registeredMembers().length, "Member count of resource").to.equal(1);
      expect(activity.resources().named("Koje").registeredMembers(), "Members of resource").to.contain('memberId1');
      expect(activity.resources().named("Schlafsaal").limit(), "Limit of resource").to.equal(30);
      expect(activity.resources().named("Schlafsaal").registeredMembers().length, "Member count of resource").to.equal(0);
      done();
    });

  });

  it('exchanges the names of two resources with registered members when the resource order is changed', function (done) {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
      {memberId: 'memberId1'}
    ], limit: 10},
      Doppelzimmer: {_registeredMembers: [
        {memberId: 'memberId2'}
      ], limit: 20}}})
      .fillFromUI({resources: {names: ["Doppelzimmer", "Einzelzimmer"], limits: ["10", "20"], previousNames: ["Einzelzimmer", "Doppelzimmer"] }});

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
