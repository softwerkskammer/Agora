"use strict";

var conf = require('../configureForTest');

var beans = conf.get('beans');
var Group = beans.get('group');
var Member = beans.get('member');
var expect = require('chai').expect;

describe('Group object', function () {

  it('should deliver two types of groups', function () {
    var allTypes = Group.allTypes();
    expect(allTypes.length).to.equal(2);
    expect(allTypes).to.contain('Themengruppe');
    expect(allTypes).to.contain('Regionalgruppe');
  });

  it('should deliver the group for Themengruppe', function () {
    var group = new Group({id: 'abc', type: 'Themengruppe'});
    expect(Group.thematicsFrom([group])).to.deep.equal([group]);
    expect(Group.regionalsFrom([group])).to.deep.equal([]);
  });

  it('should deliver the group for Regionalgruppe', function () {
    var group = new Group({id: 'abc', type: 'Regionalgruppe'});
    expect(Group.thematicsFrom([group])).to.deep.equal([]);
    expect(Group.regionalsFrom([group])).to.deep.equal([group]);
  });

  it('should transform the id to lowercase', function () {
    var group = new Group({id: 'NeuePlattform'});
    expect(group.id).to.equal('neueplattform');
  });

  it('should generate a list for the organizers based on members, only one in organizers', function () {
    var group = new Group({id: 'NeuePlattform', organizers: ['Hans', 'Heinz']});
    var members = [new Member({id: 'Hans'}), new Member({id: 'Karl'})];
    var checkedOrganizers = group.checkedOrganizers(members);
    expect(checkedOrganizers.length).to.equal(2);
    expect(checkedOrganizers[0].member.id()).to.equal('Hans');
    expect(checkedOrganizers[0].checked).to.be.true;
    expect(checkedOrganizers[1].member.id()).to.equal('Karl');
    expect(checkedOrganizers[1].checked).to.be.false;
  });

  it('descriptionHTMLFiltered should filter the description html by given matchOpenClosedTag', function () {
    var descriptionHTML = function () {
      return '<a href="#">asda</a>description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered("a")).to.equal('description');
  });

  it('descriptionHTMLFiltered should filter the description html by given matchSingleClosedTag', function () {
    var descriptionHTML = function () {
      return '<img src="#"/>description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered("img")).to.equal('description');
  });

  it('descriptionHTMLFiltered should filter the description html by given matchSingleTag', function () {
    var descriptionHTML = function () {
      return '<img src="#">description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered("img")).to.equal('description');
  });

  it('answers that a memberId is one of its organizers', function () {
    var group = new Group();
    group.organizers = ['id'];
    expect(group.isOrganizer('id')).to.be.true;
  });

  it('answers that a wrong memberId is not one of its organizers', function () {
    var group = new Group();
    group.organizers = ['id'];
    expect(group.isOrganizer('anotherId')).to.be.false;
  });

  it('answers that a memberId is not one of its organizers if there are no organizers initialized', function () {
    var group = new Group();
    expect(group.isOrganizer('anotherId')).to.be.false;
  });

});
