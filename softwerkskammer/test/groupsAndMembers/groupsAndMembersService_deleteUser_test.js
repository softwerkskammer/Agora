"use strict";

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();
const beans = require("../../testutil/configureForTest").get("beans");

const Member = beans.get("member");

const dummymember = new Member({ id: "nick" });

const Group = beans.get("group");

const GroupA = new Group({
  id: "GroupA",
  longName: "Gruppe A",
  description: "Dies ist Gruppe A.",
  type: "Themengruppe",
  subscribedMembers: ["nick", "nock"],
});
const GroupB = new Group({
  id: "GroupB",
  longName: "Gruppe B",
  description: "Dies ist Gruppe B.",
  type: "Regionalgruppe",
  subscribedMembers: ["nick"],
});

const memberstore = beans.get("memberstore");
const groupsService = beans.get("groupsService");
const groupstore = beans.get("groupstore");

const groupsAndMembersService = beans.get("groupsAndMembersService");

describe("Groups and Members Service (member deletion)", () => {
  let removeMemberSpy;
  let savedGroups;

  beforeEach(() => {
    savedGroups = [];
    removeMemberSpy = null;
    sinon.stub(memberstore, "getMember").returns(dummymember);
    sinon.stub(memberstore, "getMemberForId").returns(dummymember);
    sinon.stub(groupstore, "saveGroup").callsFake((group) => {
      savedGroups.push(group);
    });
    removeMemberSpy = sinon.stub(memberstore, "removeMember");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("removes the groups membership and kills the member", async () => {
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([GroupA, GroupB]);

    await groupsAndMembersService.removeMember("nick");
    expect(savedGroups.length).to.equal(2);
    savedGroups.forEach((g) => {
      expect(g.subscribedMembers).not.to.include("nick");
    });
    sinon.assert.calledWith(removeMemberSpy, dummymember);
  });

  it("does not call the groups when no groups subscribed but kills the member", async () => {
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([]);

    await groupsAndMembersService.removeMember("nick");
    expect(savedGroups.length).to.equal(0);
  });
});
