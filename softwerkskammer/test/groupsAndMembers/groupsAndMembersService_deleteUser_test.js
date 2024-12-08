"use strict";

require("../../testutil/configureForTest");

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const Member = require("../../lib/members/member");

const dummymember = new Member({ id: "nick" });

const Group = require("../../lib/groups/group");

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

const memberstore = require("../../lib/members/memberstore");
const groupsService = require("../../lib/groups/groupsService");
const groupstore = require("../../lib/groups/groupstore");

const groupsAndMembersService = require("../../lib/groupsAndMembers/groupsAndMembersService");

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

  it("removes the groups membership and kills the member", () => {
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([GroupA, GroupB]);

    groupsAndMembersService.removeMember("nick");
    expect(savedGroups.length).to.equal(2);
    savedGroups.forEach((g) => {
      expect(g.subscribedMembers).not.to.include("nick");
    });
    sinon.assert.calledWith(removeMemberSpy, dummymember);
  });

  it("does not call the groups when no groups subscribed but kills the member", () => {
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([]);

    groupsAndMembersService.removeMember("nick");
    expect(savedGroups.length).to.equal(0);
  });
});
