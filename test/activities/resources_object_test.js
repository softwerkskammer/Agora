"use strict";

require('../configureForTest');
var expect = require('chai').expect;

var beans = require('nconf').get('beans');

var Resources = beans.get('resources');


describe("Resources (fillFromUI)", function () {

  it("does nothing if the name is not changed", function (done) {
    var resources = new Resources({ name1: {_registeredMembers: ['memberId']}});

    resources.fillFromUI({names: "name1", limits: "", previousNames: "name1"});

    expect(resources.resourceNames().length).to.equal(1);
    expect(resources.resourceNames()).to.contain("name1");
    expect(resources.state.name1._registeredMembers.length).to.equal(1);
    expect(resources.state.name1._registeredMembers).to.contain('memberId');
    done();
  });

  it("renames the key if the name is changed", function (done) {
    var resources = new Resources({ name1: {_registeredMembers: ['memberId']}});

    resources.fillFromUI({names: "name2", limits: "", previousNames: "name1"});

    expect(resources.resourceNames().length).to.equal(1);
    expect(resources.resourceNames()).to.not.contain("name1");
    expect(resources.resourceNames()).to.contain("name2");
    expect(resources.state.name2._registeredMembers.length).to.equal(1);
    expect(resources.state.name2._registeredMembers).to.contain('memberId');
    done();
  });

  it("removes the key if the new name is empty", function (done) {
    var resources = new Resources({ name1: {_registeredMembers: []}});

    resources.fillFromUI({names: "", limits: "", previousNames: "name1"});

    expect(resources.resourceNames().length).to.equal(0);
    done();
  });

  it("creates the key if the previous name is empty", function (done) {
    var resources = new Resources({});

    resources.fillFromUI({names: "name1", limits: "", previousNames: ""});

    expect(resources.resourceNames().length).to.equal(1);
    expect(resources.resourceNames()).to.contain("name1");
    expect(resources.state.name1._registeredMembers.length).to.equal(0);
    done();
  });

  it("adds a limit if it is given", function (done) {
    var resources = new Resources({ name1: {_registeredMembers: []}});

    resources.fillFromUI({names: "name1", limits: "10", previousNames: "name1"});

    expect(resources.state.name1._limit).to.equal(10);
    done();
  });

  it("removes a limit if it is not given", function (done) {
    var resources = new Resources({ name1: {_registeredMembers: [], _limit: 20}});

    resources.fillFromUI({names: "name1", limits: "", previousNames: "name1"});

    expect(resources.state.name1._limit).to.be.undefined;
    done();
  });

  it("exchanges two resources if their names are switched", function (done) {
    var resources = new Resources({ name1: {_registeredMembers: ['memberId1']},
      name2: {_registeredMembers: ['memberId2']}});

    resources.fillFromUI({names: ["name2", "name1"], limits: ["", ""], previousNames: ["name1", "name2"]});

    expect(resources.resourceNames().length).to.equal(2);
    expect(resources.resourceNames()).to.contain("name1");
    expect(resources.resourceNames()).to.contain("name2");
    expect(resources.state.name1._registeredMembers.length).to.equal(1);
    expect(resources.state.name1._registeredMembers).to.contain('memberId2');
    expect(resources.state.name2._registeredMembers.length).to.equal(1);
    expect(resources.state.name2._registeredMembers).to.contain('memberId1');
    done();
  });


});