"use strict";

require('../configureForTest');
var expect = require('chai').expect;

var beans = require('nconf').get('beans');

var Resources = beans.get('resources');

describe("Resources (fillFromUI)", function () {
  describe("adding / removing children", function () {

    it("does nothing if the name is not changed", function () {
      var resources = new Resources({ name1: {_registeredMembers: [
        {memberId: 'memberId'}
      ]}});

      resources.fillFromUI({names: "name1", limits: "", previousNames: "name1"});

      expect(resources.resourceNames().length).to.equal(1);
      expect(resources.resourceNames()).to.contain("name1");
      expect(resources.named('name1').registeredMembers().length).to.equal(1);
      expect(resources.named('name1').registeredMembers()).to.contain('memberId');
    });

    it("renames the key if the name is changed", function () {
      var resources = new Resources({ name1: {_registeredMembers: [
        {memberId: 'memberId'}
      ]}});

      resources.fillFromUI({names: "name2", limits: "", previousNames: "name1"});

      expect(resources.resourceNames().length).to.equal(1);
      expect(resources.resourceNames()).to.not.contain("name1");
      expect(resources.resourceNames()).to.contain("name2");
      expect(resources.named('name2').registeredMembers().length).to.equal(1);
      expect(resources.named('name2').registeredMembers()).to.contain('memberId');
    });

    it("removes the key if the new name is empty", function () {
      var resources = new Resources({ name1: {}});

      resources.fillFromUI({names: "", limits: "", previousNames: "name1"});

      expect(resources.resourceNames().length).to.equal(0);
    });

    it("creates the key if the previous name is empty", function () {
      var resources = new Resources({});

      resources.fillFromUI({names: "name1", limits: "", previousNames: ""});

      expect(resources.resourceNames().length).to.equal(1);
      expect(resources.resourceNames()).to.contain("name1");
      expect(resources.named('name1').registeredMembers().length).to.equal(0);
    });

    it("exchanges two resources if their names are switched", function () {
      var resources = new Resources({ name1: {_registeredMembers: [
        {memberId: 'memberId1'}
      ]},
        name2: {_registeredMembers: [
          {memberId: 'memberId2'}
        ]}});

      resources.fillFromUI({names: ["name2", "name1"], limits: ["", ""], previousNames: ["name1", "name2"]});

      expect(resources.resourceNames().length).to.equal(2);
      expect(resources.resourceNames()).to.contain("name1");
      expect(resources.resourceNames()).to.contain("name2");
      expect(resources.named('name1').registeredMembers().length).to.equal(1);
      expect(resources.named('name1').registeredMembers()).to.contain('memberId2');
      expect(resources.named('name2').registeredMembers().length).to.equal(1);
      expect(resources.named('name2').registeredMembers()).to.contain('memberId1');
    });
  });

  describe("integration test", function () {
    
    it("adheres to values in constructor", function () {
      var resources = new Resources({ name1: {_limit: 20, _registrationOpen: true, _withWaitinglist: true}});

      expect(resources.named('name1').limit()).to.equal(20);
      expect(resources.named('name1').registrationOpen()).to.be.true;
      expect(resources.named('name1').withWaitinglist()).to.be.true;
    });

    it("adds values if given", function () {
      var resources = new Resources({ name1: {}});

      resources.fillFromUI({names: "name1", previousNames: "name1", limits: "10", registrationOpen: "anything", withWaitinglist: "someValue"});

      expect(resources.named('name1').limit()).to.equal(10);
      expect(resources.named('name1').registrationOpen()).to.be.true;
      expect(resources.named('name1').withWaitinglist()).to.be.true;
    });

    it("removes value if not given", function () {
      var resources = new Resources({ name1: {_limit: 20, _registrationOpen: true, _withWaitinglist: true}});

      resources.fillFromUI({names: "name1", limits: "", previousNames: "name1"});

      expect(resources.named('name1').limit()).to.be.undefined;
      expect(resources.named('name1').registrationOpen()).to.be.false;
      expect(resources.named('name1').withWaitinglist()).to.be.false;
    });
  });
});
