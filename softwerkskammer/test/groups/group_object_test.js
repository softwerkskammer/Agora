'use strict';

var beans = require('../../testutil/configureForTest').get('beans');
var Group = beans.get('group');
var Member = beans.get('member');
var expect = require('must-dist');

describe('Group object', function () {

  describe('constructor', function () {

    it('reads a single organizer into an array', function () {
      var group = new Group({id: 'group', organizers: 'id'});

      expect(group.organizers).to.be.an.array();
      expect(group.organizers).to.contain('id');
    });

    it('reads two organizers into an array', function () {
      var group = new Group({id: 'group', organizers: 'idA,idB'});

      expect(group.organizers).to.be.an.array();
      expect(group.organizers).to.contain('idA');
      expect(group.organizers).to.contain('idB');
    });

    it('leaves an organizers array as-is', function () {
      var group = new Group({id: 'group', organizers: ['idA', 'idB'] });

      expect(group.organizers).to.be.an.array();
      expect(group.organizers).to.contain('idA');
      expect(group.organizers).to.contain('idB');
    });

  });

});

describe('should deliver', function () {

  it('two types of groups', function () {
    var allTypes = Group.allTypes();
    expect(allTypes.length).to.equal(2);
    expect(allTypes).to.contain('Themengruppe');
    expect(allTypes).to.contain('Regionalgruppe');
  });

  it('the group for Themengruppe', function () {
    var group = new Group({id: 'abc', type: 'Themengruppe'});
    expect(Group.thematicsFrom([group])).to.eql([group]);
    expect(Group.regionalsFrom([group])).to.eql([]);
  });

  it('the group for Regionalgruppe', function () {
    var group = new Group({id: 'abc', type: 'Regionalgruppe'});
    expect(Group.thematicsFrom([group])).to.eql([]);
    expect(Group.regionalsFrom([group])).to.eql([group]);
  });

});

it('should transform the id to lowercase', function () {
  var group = new Group({id: 'NeuePlattform'});
  expect(group.id).to.equal('neueplattform');
});

describe('descriptionHTMLFiltered should filter the description html by given', function () {

  it('matchOpenClosedTag', function () {
    var descriptionHTML = function () {
      return '<a href="#">asda</a>description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered('a')).to.equal('description');
  });

  it('matchSingleClosedTag', function () {
    var descriptionHTML = function () {
      return '<img src="#"/>description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered('img')).to.equal('description');
  });

  it('matchSingleTag', function () {
    var descriptionHTML = function () {
      return '<img src="#">description';
    };
    var group = new Group();
    group.descriptionHTML = descriptionHTML;

    expect(group.descriptionHTMLFiltered('img')).to.equal('description');
  });

});

it('should generate a list for the organizers based on members, only one in organizers', function () {
  var group = new Group({id: 'NeuePlattform', organizers: ['Hans', 'Heinz']});
  var members = [new Member({id: 'Hans'}), new Member({id: 'Karl'})];
  var checkedOrganizers = group.checkedOrganizers(members);
  expect(checkedOrganizers.length).to.equal(2);
  expect(checkedOrganizers[0].member.id()).to.equal('Hans');
  expect(checkedOrganizers[0].checked).to.be(true);
  expect(checkedOrganizers[1].member.id()).to.equal('Karl');
  expect(checkedOrganizers[1].checked).to.be(false);
});

describe('answers that a', function () {

  it('memberId is one of its organizers', function () {
    var group = new Group({id: 'groupA', organizers: 'id'});
    expect(group.isOrganizer('id')).to.be(true);
  });

  it('wrong memberId is not one of its organizers', function () {
    var group = new Group({id: 'groupA', organizers: 'id'});
    expect(group.isOrganizer('anotherId')).to.be(false);
  });

  it('memberId is not one of its organizers if there are no organizers initialized', function () {
    var group = new Group();
    expect(group.isOrganizer('anotherId')).to.be(false);
  });

});

describe('delivers the symmetric difference of organizers to', function () {

  it('no other group (first arg is undefined)', function () {
    var group = new Group({id: 'groupA', organizers: 'id'});
    expect(Group.organizersOnlyInOneOf(undefined, group)).to.contain('id');
  });

  it('no other group (second arg is undefined)', function () {
    var group = new Group({id: 'groupA', organizers: 'id'});
    expect(Group.organizersOnlyInOneOf(group)).to.contain('id');
  });

  it('another group (identical organizers)', function () {
    var groupA = new Group({id: 'groupA', organizers: 'id'});
    var groupB = new Group({id: 'groupB', organizers: 'id'});
    expect(Group.organizersOnlyInOneOf(groupA, groupB)).to.not.contain('id');
  });

  it('another group (additional organizers on both sides)', function () {
    var groupA = new Group({id: 'groupA', organizers: ['id', 'idA'] });
    var groupB = new Group({id: 'groupB', organizers: ['id', 'idB'] });
    expect(Group.organizersOnlyInOneOf(groupA, groupB)).to.contain('idA');
    expect(Group.organizersOnlyInOneOf(groupA, groupB)).to.contain('idB');
    expect(Group.organizersOnlyInOneOf(groupA, groupB)).to.not.contain('id');
  });

});

