'use strict';

const sinon = require('sinon').createSandbox();
const beans = require('../../testutil/configureForTest').get('beans');

const expect = require('must-dist');

const Member = beans.get('member');

const dummymember = new Member().initFromSessionUser({authenticationId: 'hada', profile: {emails: [{value: 'email'}]}});
const dummymember2 = new Member().initFromSessionUser({authenticationId: 'hada2', profile: {emails: [{value: 'email'}]}});

const Group = beans.get('group');

const GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
const GroupB = new Group({id: 'GroupB', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});

const memberstore = beans.get('memberstore');
const membersService = beans.get('membersService');
const groupsService = beans.get('groupsService');
const groupstore = beans.get('groupstore');

const groupsAndMembersService = beans.get('groupsAndMembersService');

describe('Groups and Members Service (getMemberWithHisGroups or getMemberWithHisGroupsByMemberId)', () => {

  afterEach(() => {
    sinon.restore();
  });

  describe('- getMemberWithHisGroups -', () => {
    it('returns no member when there is no member for the given nickname', done => {
      sinon.stub(memberstore, 'getMember').callsFake((nickname, callback) => {
        callback(null, null);
      });

      groupsAndMembersService.getMemberWithHisGroups('nickname', (err, member) => {
        expect(member).to.not.exist();
        done(err);
      });
    });

    it('returns the member and his groups when there is a member for the given nickname', done => {
      sinon.stub(memberstore, 'getMember').callsFake((nickname, callback) => {
        callback(null, dummymember);
      });
      sinon.stub(groupsService, 'getSubscribedGroupsForUser').callsFake((userMail, globalCallback) => {
        globalCallback(null, [GroupA, GroupB]);
      });

      groupsAndMembersService.getMemberWithHisGroups('nickname', (err, member) => {
        expect(member).to.equal(dummymember);
        expect(member.subscribedGroups).to.not.be(null);
        expect(member.subscribedGroups.length).to.equal(2);
        expect(member.subscribedGroups[0]).to.equal(GroupA);
        expect(member.subscribedGroups[1]).to.equal(GroupB);
        done(err);
      });
    });
  });

  describe('- getMemberWithHisGroupsByMemberId -', () => {
    it('returns no member when there is no member for the given memberID', done => {
      sinon.stub(memberstore, 'getMemberForId').callsFake((memberID, callback) => {
        callback(null, null);
      });

      groupsAndMembersService.getMemberWithHisGroupsByMemberId('id', (err, member) => {
        expect(member).to.not.exist();
        done(err);
      });
    });

    it('returns the member and his groups when there is a member for the given memberID', done => {
      sinon.stub(memberstore, 'getMemberForId').callsFake((memberID, callback) => {
        callback(null, dummymember);
      });
      sinon.stub(groupsService, 'getSubscribedGroupsForUser').callsFake((userMail, globalCallback) => {
        globalCallback(null, [GroupA, GroupB]);
      });

      groupsAndMembersService.getMemberWithHisGroupsByMemberId('id', (err, member) => {
        expect(member).to.equal(dummymember);
        expect(member.subscribedGroups).to.not.be(null);
        expect(member.subscribedGroups.length).to.equal(2);
        expect(member.subscribedGroups[0]).to.equal(GroupA);
        expect(member.subscribedGroups[1]).to.equal(GroupB);
        done(err);
      });
    });
  });
});

function thereIsNoGroupFor(groupId) {
  sinon.stub(groupstore, 'getGroup')
    .withArgs(groupId, sinon.match.any)
    .callsFake((groupname, callback) => { callback(null, null); });
}

function thereAreNoMailingListUsersFor(groupId) {
  sinon.stub(groupsService, 'getMailinglistUsersOfList')
    .withArgs(groupId, sinon.match.any)
    .callsFake((ignoredErr, callback) => { callback(null, []); });
}

function thereIsGroup(group) {
  sinon.stub(groupstore, 'getGroup')
    .withArgs(group.id, sinon.match.any)
    .callsFake((groupname, callback) => {callback(null, group);
  });
}

function groupHasMembers(members) {
  const mailingListSubscribers = ['user@email.com'];
  sinon.stub(groupsService, 'getMailinglistUsersOfList')
    .callsFake((ignoredErr, callback) => {callback(null, mailingListSubscribers); });
  sinon.stub(memberstore, 'getMembersForEMails')
    .withArgs(mailingListSubscribers, sinon.match.any)
    .callsFake((member, callback) => {callback(null, members);
  });
  sinon.stub(membersService, 'putAvatarIntoMemberAndSave')
    .callsFake((member, callback) => {callback();
  });
}

function anyGroupMember() {
  return new Member({id: 'any-member-id'});
}

describe('Groups and Members Service (getGroupAndMembersForList)', () => {

  beforeEach(() => {
    sinon.stub(memberstore, 'allMembers').callsFake(callback => { callback(null, null); });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns no group when there is no group and no mailing-list', done => {
    sinon.stub(memberstore, 'getMembersForEMails').callsFake((member, callback) => { callback(); });
    thereAreNoMailingListUsersFor('unbekannteListe');
    thereIsNoGroupFor('unbekannteListe');

    groupsAndMembersService.getGroupAndMembersForList('unbekannteListe', (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns no group when there is no group but a mailing-list', done => {
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((ignoredErr, callback) => {
      callback(null, ['user1@mail1.com', 'user2@mail2.com']);
    });
    sinon.stub(memberstore, 'getMembersForEMails').callsFake((member, callback) => {
      callback(null, [dummymember, dummymember2]);
    });
    thereIsNoGroupFor('mailingListWithoutGroup');

    groupsAndMembersService.getGroupAndMembersForList('mailingListWithoutGroup', (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns the group with the given name and an empty list of subscribed users when there is no mailing-list or when there are no subscribers', done => {
    const groupId = GroupA.id;
    thereAreNoMailingListUsersFor(groupId);
    sinon.stub(groupstore, 'getGroup').callsFake((groupname, callback) => {
      callback(null, GroupA);
    });
    sinon.stub(memberstore, 'getMembersForEMails').callsFake((member, callback) => {
      callback(null, []);
    });

    groupsAndMembersService.getGroupAndMembersForList(groupId, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(0);
      done(err);
    });
  });

  it('returns the group with the given name and a list of one subscribed user when there is one subscriber in mailinglist', done => {
    thereIsGroup(GroupA);
    groupHasMembers([dummymember]);

    groupsAndMembersService.getGroupAndMembersForList(GroupA.id, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      done(err);
    });
  });

  it('fails gracefully if groupsService has an error', done => {
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((ignoredErr, callback) => { callback(new Error()); });
    sinon.stub(groupstore, 'getGroup').callsFake((groupname, callback) => {
      callback(null, GroupA);
    });

    groupsAndMembersService.getGroupAndMembersForList('GroupA', err => {
      expect(err).to.exist();
      done();
    });
  });

});

describe('Groups and Members Service (getOrganizersOfGroup)', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns no organizer when there is no group', (done) => {
    const groupId = 'not-existing-group';
    thereIsNoGroupFor(groupId);
    groupsAndMembersService.getOrganizersOfGroup(groupId, (error, organizers) => {
      expect(organizers).to.be.empty();
      done(error);
    });
  });

  it('returns no organizer when there is a group without an organizer', (done) => {
    const groupId = 'existing-group-without-organizer';
    thereIsGroup(new Group({id: groupId, organizers: []}));
    groupHasMembers([]);
    groupsAndMembersService.getOrganizersOfGroup(groupId, (error, organizers) => {
      expect(organizers).to.be.empty();
      done(error);
    });
  });

  it('returns the organizer when there is one and the group exists', (done) => {
    const groupId = 'group-with-one-organizer';
    const organizerId = 'organizerId';
    const organizer = new Member({id: organizerId});
    const member = anyGroupMember();
    thereIsGroup(new Group({id: groupId, organizers: [organizerId]}));
    groupHasMembers([organizer, member]);
    groupsAndMembersService.getOrganizersOfGroup(groupId, (error, organizers) => {
      expect(organizers).to.have.length(1);
      expect(organizers[0].id()).to.equal(organizerId);
      done(error);
    });
  });
});

describe('Groups and Members Service (addMembercountToGroup)', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('returns no group when the group is null', done => {
    groupsAndMembersService.addMembercountToGroup(null, (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns no group when the group is undefined', done => {
    groupsAndMembersService.addMembercountToGroup(undefined, (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('adds zero to group if there are no subscribers', done => {
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((ignoredErr, callback) => { callback(null, []); });
    groupsAndMembersService.addMembercountToGroup({}, (err, group) => {
      expect(group.membercount).to.equal(0);
      done(err);
    });
  });

  it('adds the number of subscribers to the group', done => {
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((ignoredErr, callback) => { callback(null, ['1', '2', '4']); });
    groupsAndMembersService.addMembercountToGroup({}, (err, group) => {
      expect(group.membercount).to.equal(3);
      done(err);
    });
  });

});

describe('Groups and Members Service (addMembersToGroup)', () => {

  beforeEach(() => {
    sinon.stub(memberstore, 'allMembers').callsFake(callback => { callback(null, null); });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('returns no group when the group is null', done => {
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake(() => undefined);
    sinon.stub(memberstore, 'getMembersForEMails').callsFake(() => undefined);

    groupsAndMembersService.addMembersToGroup(null, (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns no group when the group is undefined', done => {
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake(() => undefined);
    sinon.stub(memberstore, 'getMembersForEMails').callsFake(() => undefined);

    groupsAndMembersService.addMembersToGroup(undefined, (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it('returns the group with an empty list of subscribed users when there are no subscribers', done => {
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((ignoredErr, callback) => { callback(null, []); });
    sinon.stub(memberstore, 'getMembersForEMails').callsFake((member, callback) => {
      callback(null, []);
    });

    groupsAndMembersService.addMembersToGroup(GroupA, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(0);
      expect(group.membercount).to.equal(0);
      delete group.members;
      done(err);
    });
  });

  it('returns the group with a list of one subscribed user when there is one subscriber in mailinglist', done => {
    sinon.stub(groupsService, 'getMailinglistUsersOfList').callsFake((ignoredErr, callback) => { callback(null, ['user@email.com']); });
    sinon.stub(memberstore, 'getMembersForEMails').callsFake((member, callback) => {
      callback(null, [dummymember]);
    });
    sinon.stub(membersService, 'putAvatarIntoMemberAndSave').callsFake((member, callback) => {
      callback();
    });

    groupsAndMembersService.addMembersToGroup(GroupA, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(1);
      expect(group.membercount).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      delete group.members;
      done(err);
    });
  });

});

describe('Groups and Members Service (memberIsInMemberList)', () => {

  it('returns false if the user id is undefined', () => {
    expect(groupsAndMembersService.memberIsInMemberList(undefined, [dummymember, dummymember2])).to.be(false);
  });

  it('returns false if the member list is empty', () => {
    expect(groupsAndMembersService.memberIsInMemberList('hada', [])).to.be(false);
  });

  it('returns false if the user is not in the member list', () => {
    expect(groupsAndMembersService.memberIsInMemberList('trallala', [dummymember])).to.be(false);
  });

  it('returns true if the user is in the member list', () => {
    expect(groupsAndMembersService.memberIsInMemberList('hada', [dummymember, dummymember2])).to.be(true);
  });
});

