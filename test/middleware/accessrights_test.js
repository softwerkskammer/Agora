"use strict";

var conf = require('../configureForTest');
var beans = conf.get('beans');
var accessrights = beans.get('accessrights');
var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');
var expect = require('chai').expect;

function guest() {
  var req = {  };
  var res = { locals: {} };
  accessrights(req, res, function () {});
  return res.locals.accessrights;
}

function standardMember(member) {
  var memberOfUser = member || {};
  var req = { isAuthenticated: function () { return true; }, user: {member: new Member(memberOfUser)} };
  var res = { locals: {} };
  accessrights(req, res, function () {});
  return res.locals.accessrights;
}

function superuser() {
  // 'superuserID' is set in configureForTest as one valid superuser Id
  return standardMember({id: 'superuserID'});
}

describe('Accessrights for Activities', function () {
  it('disallows the creation for guests', function () {
    expect(guest().canCreateActivity()).to.be.false;
  });

  it('allows the creation for members', function () {
    expect(standardMember().canCreateActivity()).to.be.true;
  });

  it('disallows editing other member\'s activity for normal user', function () {
    var activity = new Activity({owner: 'somebody'});
    expect(standardMember().canEditActivity(activity)).to.be.false;
  });

  it('allows editing own activity', function () {
    var activity = new Activity({owner: 'id'});
    expect(standardMember({id: 'id'}).canEditActivity(activity)).to.be.true;
  });

  it('allows editing for contactpersons of activity\'s group', function () {
    var group = new Group();
    var activity = new Activity({owner: 'someOtherId'});
    activity.group = group;
    group.organizers = ['id'];

    expect(standardMember({id: 'id'}).canEditActivity(activity)).to.be.true;
  });
  
  it('disallows editing for contactpersons of other group', function () {
    var group = new Group();
    group.organizers = ['id'];

    var activity = new Activity({owner: 'someOtherId'});
    activity.group = new Group();

    expect(standardMember({id: 'id'}).canEditActivity(activity)).to.be.false;
  });
});

describe('Accessrights for Announcements', function () {
  it('disallows the creation for members', function () {
    expect(standardMember().canCreateAnnouncement()).to.be.false;
  });

  it('allows the creation for superusers', function () {
    expect(superuser().canCreateAnnouncement()).to.be.true;
  });

  it('disallows editing for members', function () {
    expect(standardMember().canEditAnnouncement()).to.be.false;
  });

  it('allows editing for superusers', function () {
    expect(superuser().canEditAnnouncement()).to.be.true;
  });
});

describe('Accessrights for Groups', function () {
  it('disallows the creation for guests', function () {
    expect(guest().canCreateGroup()).to.be.false;
  });

  it('allows the creation for members', function () {
    expect(standardMember().canCreateGroup()).to.be.true;
  });

  it('allows editing for contact persons', function () {
    var group = new Group();
    group.organizers = ['id'];
    expect(standardMember({id: 'id'}).canEditGroup(group)).to.be.true;
  });

  it('disallows editing for non-contact persons of group', function () {
    var group = new Group();
    group.organizers = ['id'];
    expect(standardMember({id: 'otherId'}).canEditGroup(group)).to.be.false;
  });

  it('disallows editing for contact persons of some other group', function () {
    var group = new Group();
    group.organizers = ['id'];
    expect(standardMember({id: 'id'}).canEditGroup(new Group())).to.be.false;
  });

  it('allows editing for superusers', function () {
    expect(superuser().canEditGroup()).to.be.true;
  });

  it('disallows guest to edit a group', function () {
    expect(guest().canEditGroup(new Group())).to.be.false;
  });

  it('disallows guest to view group details', function () {
    expect(guest().canViewGroupDetails()).to.be.false;
  });

  it('allows every registered member to view group details', function () {
    expect(standardMember().canViewGroupDetails()).to.be.true;
  });

  it('disallows guest to participate in a group', function () {
    expect(guest().canParticipateInGroup()).to.be.false;
  });

  it('allows every registered member to participate in a group', function () {
    expect(standardMember().canParticipateInGroup()).to.be.true;
  });
});

describe('Accessrights for Colors', function () {
  it('disallows the creation for members', function () {
    expect(standardMember().canCreateColor()).to.be.false;
  });

  it('allows the creation for superusers', function () {
    expect(superuser().canCreateColor()).to.be.true;
  });
});

describe('Accessrights for Members', function () {
  it('disallows editing others for members', function () {
    var member = {id: 'id'};
    var otherMember = new Member({id: 'other'});
    expect(standardMember(member).canEditMember(otherMember)).to.be.false;
  });

  it('allows editing herself for members', function () {
    var member = {id: 'id'};
    expect(standardMember(member).canEditMember(new Member(member))).to.be.true;
  });

  it('allows editing others for superusers', function () {
    var otherMember = new Member({id: 'other'});
    expect(superuser().canEditMember(otherMember)).to.be.true;
  });
});

