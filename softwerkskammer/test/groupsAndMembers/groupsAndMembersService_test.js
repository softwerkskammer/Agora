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

describe("Groups and Members Service", () => {
  describe("(getMemberWithHisGroups or getMemberWithHisGroupsByMemberId)", () => {
    afterEach(() => {
      sinon.restore();
    });

    describe("- getMemberWithHisGroups -", () => {
      it("returns no member when there is no member for the given nickname", async () => {
        sinon.stub(memberstore, "getMember").returns(null);

        const member = await groupsAndMembersService.getMemberWithHisGroups("nickname");
        expect(member).to.not.exist();
      });

      it("returns the member and his groups when there is a member for the given nickname", async () => {
        sinon.stub(memberstore, "getMember").returns(dummymember);
        sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([GroupA, GroupB]);

        const member = await groupsAndMembersService.getMemberWithHisGroups("nickname");
        expect(member).to.equal(dummymember);
        expect(member.subscribedGroups).to.not.be(null);
        expect(member.subscribedGroups.length).to.equal(2);
        expect(member.subscribedGroups[0]).to.equal(GroupA);
        expect(member.subscribedGroups[1]).to.equal(GroupB);
      });
    });

    describe("- getMemberWithHisGroupsByMemberId -", () => {
      it("returns no member when there is no member for the given memberID", async () => {
        sinon.stub(memberstore, "getMemberForId").returns(null);

        const member = await groupsAndMembersService.getMemberWithHisGroupsByMemberId("id");
        expect(member).to.not.exist();
      });

      it("returns the member and his groups when there is a member for the given memberID", async () => {
        sinon.stub(memberstore, "getMemberForId").returns(dummymember);
        sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([GroupA, GroupB]);

        const member = await groupsAndMembersService.getMemberWithHisGroupsByMemberId("id");
        expect(member).to.equal(dummymember);
        expect(member.subscribedGroups).to.not.be(null);
        expect(member.subscribedGroups.length).to.equal(2);
        expect(member.subscribedGroups[0]).to.equal(GroupA);
        expect(member.subscribedGroups[1]).to.equal(GroupB);
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
    sinon.stub(memberstore, "getMembersForIds").returns([]);
  }

  function thereAreMailingListUsers(members) {
    sinon.stub(memberstore, "getMembersForIds").returns(members);
  }

  function anyGroupMember() {
    return new Member({ id: "any-member-id" });
  }

  describe("(getGroupAndMembersForList)", () => {
    beforeEach(() => {
      sinon.stub(memberstore, "allMembers").returns(null);
      sinon.stub(membersService, "putAvatarIntoMemberAndSave");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("returns no group when there is no group but a mailing-list", async () => {
      thereAreMailingListUsers(["user1@mail1.com", "user2@mail2.com"]);
      thereIsNoGroupFor("mailingListWithoutGroup");

      const group = await groupsAndMembersService.getGroupAndMembersForList("mailingListWithoutGroup");
      expect(group).to.not.exist();
    });

    it("returns the group with the given name and an empty list of subscribed users when there is no mailing-list or when there are no subscribers", async () => {
      const groupId = GroupA.id;
      thereAreNoMailingListUsers();
      sinon.stub(groupstore, "getGroup").returns(GroupA);

      const group = await groupsAndMembersService.getGroupAndMembersForList(groupId);
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(0);
    });

    it("returns the group with the given name and a list of one subscribed user when there is one subscriber in mailinglist", async () => {
      thereIsGroup(GroupA);
      thereAreMailingListUsers([dummymember]);

      const group = await groupsAndMembersService.getGroupAndMembersForList(GroupA.id);
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
    });

    it("fails gracefully if mamberstore has an error", async () => {
      sinon.stub(memberstore, "getMembersForIds").throws(new Error());
      sinon.stub(groupstore, "getGroup").returns(GroupA);

      try {
        await groupsAndMembersService.getGroupAndMembersForList("GroupA");
      } catch (err) {
        expect(err).to.exist();
      }
    });
  });

  describe("(getOrganizersOfGroup)", () => {
    beforeEach(() => {
      sinon.stub(membersService, "putAvatarIntoMemberAndSave");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("returns no organizer when there is no group", async () => {
      const groupId = "not-existing-group";
      thereIsNoGroupFor(groupId);
      const organizers = await groupsAndMembersService.getOrganizersOfGroup(groupId);
      expect(organizers).to.be.empty();
    });

    it("returns no organizer when there is a group without an organizer", async () => {
      const groupId = "existing-group-without-organizer";
      thereIsGroup(new Group({ id: groupId, organizers: [], subscribedMembers: ["id1"] }));
      thereAreMailingListUsers([]);
      const organizers = await groupsAndMembersService.getOrganizersOfGroup(groupId);
      expect(organizers).to.be.empty();
    });

    it("returns the organizer when there is one and the group exists", async () => {
      const groupId = "group-with-one-organizer";
      const organizerId = "organizerId";
      const organizer = new Member({ id: organizerId });
      const member = anyGroupMember();
      thereIsGroup(new Group({ id: groupId, organizers: [organizerId] }));
      thereAreMailingListUsers([organizer, member]);
      const organizers = await groupsAndMembersService.getOrganizersOfGroup(groupId);
      expect(organizers).to.have.length(1);
      expect(organizers[0].id()).to.equal(organizerId);
    });

    it("returns the organizers when there are any and the group exists", async () => {
      const groupId = "group-with-organizers";
      const organizerId1 = "organizerId1";
      const organizerId2 = "organizerId2";
      const organizer1 = new Member({ id: organizerId1 });
      const organizer2 = new Member({ id: organizerId2 });
      const member = anyGroupMember();
      thereIsGroup(new Group({ id: groupId, organizers: [organizerId1, organizerId2] }));
      thereAreMailingListUsers([organizer1, organizer2, member]);
      const organizers = await groupsAndMembersService.getOrganizersOfGroup(groupId);
      expect(organizers).to.have.length(2);
      expect(organizers[0].id()).to.equal(organizerId1);
      expect(organizers[1].id()).to.equal(organizerId2);
    });
  });

  describe("(addMembersToGroup)", () => {
    beforeEach(() => {
      sinon.stub(memberstore, "allMembers").returns(null);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("returns the group with an empty list of subscribed users when there are no subscribers", async () => {
      thereAreNoMailingListUsers();
      groupsAndMembersService.addMembersToGroup(GroupA);
      const group = GroupA;
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(0);
      expect(group.membercount()).to.equal(0);
      delete group.members;
    });

    it("returns the group with a list of one subscribed user when there is one subscriber in mailinglist", async () => {
      thereAreMailingListUsers([dummymember]);

      GroupA.subscribedMembers = ["id1"];
      groupsAndMembersService.addMembersToGroup(GroupA);
      const group = GroupA;
      expect(group).to.equal(GroupA);
      expect(group.members).to.not.be(null);
      expect(group.members.length).to.equal(1);
      expect(group.membercount()).to.equal(1);
      expect(group.members[0]).to.equal(dummymember);
      delete group.members;
      GroupA.subscribedMembers = [];
    });
  });
});
