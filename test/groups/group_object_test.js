"use strict";

var conf = require('../configureForTest');

var beans = conf.get('beans');
var Group = beans.get('group');
var Member = beans.get('member');
var expect = require('chai').expect;

describe('Group object', function () {

  it('should deliver two types of groups', function (done) {
    var allTypes = Group.allTypes();
    expect(allTypes.length).to.equal(2);
    expect(allTypes).to.contain('Themengruppe');
    expect(allTypes).to.contain('Regionalgruppe');
    done();
  });

  it('should deliver the group for Themengruppe', function (done) {
    var group = new Group({id: 'abc', type: 'Themengruppe'});
    expect(Group.thematicsFrom([group])).to.deep.equal([group]);
    expect(Group.regionalsFrom([group])).to.deep.equal([]);
    done();
  });

  it('should deliver the group for Regionalgruppe', function (done) {
    var group = new Group({id: 'abc', type: 'Regionalgruppe'});
    expect(Group.thematicsFrom([group])).to.deep.equal([]);
    expect(Group.regionalsFrom([group])).to.deep.equal([group]);
    done();
  });

  it('should transform the id to lowercase', function (done) {
    var group = new Group({id: 'NeuePlattform'});
    expect(group.id).to.equal('neueplattform');
    done();
  });

  it('should generate a list for the organizers based on members, two admins, only one in organizers', function (done) {
    var group = new Group({id: 'NeuePlattform', organizers: ['Hans', 'Heinz']});
    var members = [new Member({id: 'Hans', isAdmin: true}), new Member({id: 'Karl', isAdmin: true})];
    var checkedOrganizers = group.checkedOrganizers(members);
    expect(checkedOrganizers.length).to.equal(2);
    expect(checkedOrganizers[0].member.id()).to.equal('Hans');
    expect(checkedOrganizers[0].checked).to.be.true;
    expect(checkedOrganizers[1].member.id()).to.equal('Karl');
    expect(checkedOrganizers[1].checked).to.be.false;
    done();
  });

  it('should generate a list for the organizers based on members, one admin, but not in organizers', function (done) {
    var group = new Group({id: 'NeuePlattform', organizers: ['Hans', 'Heinz']});
    var members = [new Member({id: 'Hans', isAdmin: false}), new Member({id: 'Karl', isAdmin: true})];
    var checkedOrganizers = group.checkedOrganizers(members);
    expect(checkedOrganizers.length).to.equal(1);
    expect(checkedOrganizers[0].member.id()).to.equal('Karl');
    expect(checkedOrganizers[0].checked).to.be.false;
    done();
  });

  it('descriptionHTMLFiltered should filter the description html by given matchOpenClosedTag', function (done) {
    var descriptionHTML = function () {
      return '<a href="#">asda</a>description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered("a")).to.equal('description');
    done();
  });

  it('descriptionHTMLFiltered should filter the description html by given matchSingleClosedTag', function (done) {
    var descriptionHTML = function () {
      return '<img src="#"/>description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered("img")).to.equal('description');
    done();
  });

  it('descriptionHTMLFiltered should filter the description html by given matchSingleTag', function (done) {
    var descriptionHTML = function () {
      return '<img src="#">description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered("img")).to.equal('description');
    done();
  });


});
