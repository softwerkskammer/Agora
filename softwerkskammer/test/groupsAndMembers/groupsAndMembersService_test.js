"use strict";

const sinon = require("sinon").createSandbox();
const beans = require("../../testutil/configureForTest").get("beans");

const expect = require("must-dist");

const Member = beans.get("member");

const dummymember = new Member({ id: "id1" });

const Group = beans.get("group");

const GroupA = new Group({
  id: "GroupA",
  longName: "Gruppe A",
  description: "Dies ist Gruppe A.",
  type: "Themengruppe",
});
const GroupB = new Group({
  id: "GroupB",
  longName: "Gruppe B",
  description: "Dies ist Gruppe B.",
  type: "Regionalgruppe",
});

const memberstore = beans.get("memberstore");
const membersService = beans.get("membersService");
const groupsService = beans.get("groupsService");
const groupstore = beans.get("groupstore");

const groupsAndMembersService = beans.get("groupsAndMembersService");

describe("Groups and Members Service (getMemberWithHisGroups or getMemberWithHisGroupsByMemberId)", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("- getMemberWithHisGroups -", () => {
    it("returns no member when there is no member for the given nickname", (done) => {
      sinon.stub(memberstore, "getMember").callsFake((nickname, callback) => {
        callback(null, null);
      });

      groupsAndMembersService.getMemberWithHisGroups("nickname", (err, member) => {
        expect(member).to.not.exist();
        done(err);
      });
    });

    it("returns the member and his groups when there is a member for the given nickname", (done) => {
      sinon.stub(memberstore, "getMember").callsFake((nickname, callback) => {
        callback(null, dummymember);
      });
      sinon.stub(groupsService, "getSubscribedGroupsForMember").callsFake((userMail, globalCallback) => {
        globalCallback(null, [GroupA, GroupB]);
      });

      groupsAndMembersService.getMemberWithHisGroups("nickname", (err, member) => {
        expect(member).to.equal(dummymember);
        expect(member.subscribedGroups).to.not.be(null);
        expect(member.subscribedGroups.length).to.equal(2);
        expect(member.subscribedGroups[0]).to.equal(GroupA);
        expect(member.subscribedGroups[1]).to.equal(GroupB);
        done(err);
      });
    });
  });

  describe("- getMemberWithHisGroupsByMemberId -", () => {
    it("returns no member when there is no member for the given memberID", (done) => {
      sinon.stub(memberstore, "getMemberForId").callsFake((memberID, callback) => {
        callback(null, null);
      });

      groupsAndMembersService.getMemberWithHisGroupsByMemberId("id", (err, member) => {
        expect(member).to.not.exist();
        done(err);
      });
    });

    it("returns the member and his groups when there is a member for the given memberID", (done) => {
      sinon.stub(memberstore, "getMemberForId").callsFake((memberID, callback) => {
        callback(null, dummymember);
      });
      sinon.stub(groupsService, "getSubscribedGroupsForMember").callsFake((userMail, globalCallback) => {
        globalCallback(null, [GroupA, GroupB]);
      });

      groupsAndMembersService.getMemberWithHisGroupsByMemberId("id", (err, member) => {
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
  sinon
    .stub(groupstore, "getGroup")
    .withArgs(groupId, sinon.match.any)
    .callsFake(() => {
      return null;
    });
}

function thereIsGroup(group) {
  sinon.stub(groupstore, "getGroup").returns(group);
}

function thereAreNoMailingListUsers() {
  sinon.stub(memberstore, "getMembersForIds").callsFake((member, callback) => {
    callback(null, []);
  });
}

function thereAreMailingListUsers(members) {
  sinon.stub(memberstore, "getMembersForIds").callsFake((member, callback) => {
    callback(null, members);
  });
}

function anyGroupMember() {
  return new Member({ id: "any-member-id" });
}

describe("Groups and Members Service (getGroupAndMembersForList)", () => {
  beforeEach(() => {
    sinon.stub(memberstore, "allMembers").callsFake((callback) => {
      callback(null, null);
    });
    sinon.stub(membersService, "putAvatarIntoMemberAndSave").callsFake((member, callback) => {
      callback();
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns no group when there is no group and no mailing-list", (done) => {
    sinon.stub(memberstore, "getMembersForEMails").callsFake((member, callback) => {
      callback();
    });
    thereIsNoGroupFor("unbekannteListe");

    groupsAndMembersService.getGroupAndMembersForList("unbekannteListe", (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it("returns no group when there is no group but a mailing-list", (done) => {
    thereAreMailingListUsers(["user1@mail1.com", "user2@mail2.com"]);
    thereIsNoGroupFor("mailingListWithoutGroup");

    groupsAndMembersService.getGroupAndMembersForList("mailingListWithoutGroup", (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it("returns the group with the given name and an empty list of subscribed users when there is no mailing-list or when there are no subscribers", (done) => {
    const groupId = GroupA.id;
    thereAreNoMailingListUsers();
    sinon.stub(groupstore, "getGroup").returns(GroupA);
    sinon.stub(memberstore, "getMembersForEMails").callsFake((member, callback) => {
      callback(null, []);
    });

    groupsAndMembersService.getGroupAndMembersForList(groupId, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(0);
      done(err);
    });
  });

  it("returns the group with the given name and a list of one subscribed user when there is one subscriber in mailinglist", (done) => {
    thereIsGroup(GroupA);
    thereAreMailingListUsers([dummymember]);

    groupsAndMembersService.getGroupAndMembersForList(GroupA.id, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      done(err);
    });
  });

  it("fails gracefully if mamberstore has an error", (done) => {
    sinon.stub(memberstore, "getMembersForIds").callsFake((someMembers, callback) => {
      callback(new Error());
    });
    sinon.stub(groupstore, "getGroup").returns(GroupA);

    groupsAndMembersService.getGroupAndMembersForList("GroupA", (err) => {
      expect(err).to.exist();
      done();
    });
  });
});

describe("Groups and Members Service (getOrganizersOfGroup)", () => {
  beforeEach(() => {
    sinon.stub(membersService, "putAvatarIntoMemberAndSave").callsFake((member, callback) => {
      callback();
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns no organizer when there is no group", (done) => {
    const groupId = "not-existing-group";
    thereIsNoGroupFor(groupId);
    groupsAndMembersService.getOrganizersOfGroup(groupId, (error, organizers) => {
      expect(organizers).to.be.empty();
      done(error);
    });
  });

  it("returns no organizer when there is a group without an organizer", (done) => {
    const groupId = "existing-group-without-organizer";
    thereIsGroup(new Group({ id: groupId, organizers: [], subscribedMembers: ["id1"] }));
    thereAreMailingListUsers([]);
    groupsAndMembersService.getOrganizersOfGroup(groupId, (error, organizers) => {
      expect(organizers).to.be.empty();
      done(error);
    });
  });

  it("returns the organizer when there is one and the group exists", (done) => {
    const groupId = "group-with-one-organizer";
    const organizerId = "organizerId";
    const organizer = new Member({ id: organizerId });
    const member = anyGroupMember();
    thereIsGroup(new Group({ id: groupId, organizers: [organizerId] }));
    thereAreMailingListUsers([organizer, member]);
    groupsAndMembersService.getOrganizersOfGroup(groupId, (error, organizers) => {
      expect(organizers).to.have.length(1);
      expect(organizers[0].id()).to.equal(organizerId);
      done(error);
    });
  });

  it("returns the organizers when there are any and the group exists", (done) => {
    const groupId = "group-with-organizers";
    const organizerId1 = "organizerId1";
    const organizerId2 = "organizerId2";
    const organizer1 = new Member({ id: organizerId1 });
    const organizer2 = new Member({ id: organizerId2 });
    const member = anyGroupMember();
    thereIsGroup(new Group({ id: groupId, organizers: [organizerId1, organizerId2] }));
    thereAreMailingListUsers([organizer1, organizer2, member]);
    groupsAndMembersService.getOrganizersOfGroup(groupId, (error, organizers) => {
      expect(organizers).to.have.length(2);
      expect(organizers[0].id()).to.equal(organizerId1);
      expect(organizers[1].id()).to.equal(organizerId2);
      done(error);
    });
  });
});

describe("Groups and Members Service (addMembersToGroup)", () => {
  beforeEach(() => {
    sinon.stub(memberstore, "allMembers").callsFake((callback) => {
      callback(null, null);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns no group when the group is null", (done) => {
    groupsAndMembersService.addMembersToGroup(null, (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it("returns no group when the group is undefined", (done) => {
    groupsAndMembersService.addMembersToGroup(undefined, (err, group) => {
      expect(group).to.not.exist();
      done(err);
    });
  });

  it("returns the group with an empty list of subscribed users when there are no subscribers", (done) => {
    thereAreNoMailingListUsers();
    groupsAndMembersService.addMembersToGroup(GroupA, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(0);
      expect(group.membercount()).to.equal(0);
      delete group.members;
      done(err);
    });
  });

  it("returns the group with a list of one subscribed user when there is one subscriber in mailinglist", (done) => {
    thereAreMailingListUsers([dummymember]);
    sinon.stub(membersService, "putAvatarIntoMemberAndSave").callsFake((member, callback) => {
      callback();
    });

    GroupA.subscribedMembers = ["id1"];
    groupsAndMembersService.addMembersToGroup(GroupA, (err, group) => {
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(1);
      expect(group.membercount()).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      delete group.members;
      GroupA.subscribedMembers = [];
      done(err);
    });
  });
});
