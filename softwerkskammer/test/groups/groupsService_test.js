"use strict";

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const conf = require("../../testutil/configureForTest");
const beans = conf.get("beans");
const Group = beans.get("group");

const groupsForTest = require("./groups_for_tests");

const groupstore = beans.get("groupstore");

const groupsService = require("../../lib/groups/groupsService");

const Member = require("../../lib/members/member");
const testMember = new Member({ id: "testmember" });

describe("Groups Service (getSubscribedGroupsForMember)", () => {
  let testGroups;

  afterEach(() => {
    sinon.restore();
  });

  function setupSubscribedListsForUser(groups) {
    testGroups = groupsForTest();
    const testGroupsArray = [testGroups.GroupA, testGroups.GroupB, testGroups.GroupC].map((g) => {
      if (groups.includes(g.id)) {
        g.subscribe(testMember);
      }
      return g;
    });
    sinon.stub(groupstore, "allGroups").returns(testGroupsArray);
  }

  it("returns an empty array of groups for a user who is not subscribed anywhere", () => {
    setupSubscribedListsForUser([]);

    const validLists = groupsService.getSubscribedGroupsForMember(testMember);
    expect(validLists).to.not.be(null);
    expect(validLists.length).to.equal(0);
  });

  it("returns one group for a user who is subscribed to one list", () => {
    setupSubscribedListsForUser(["groupa"]);

    const validLists = groupsService.getSubscribedGroupsForMember(testMember);
    expect(validLists).to.not.be(null);
    expect(validLists.length).to.equal(1);
    expect(validLists[0]).to.equal(testGroups.GroupA);
  });

  it("returns two groups for a user who is subscribed to two lists", () => {
    setupSubscribedListsForUser(["groupa", "groupb"]);

    const validLists = groupsService.getSubscribedGroupsForMember(testMember);
    expect(validLists).to.not.be(null);
    expect(validLists.length).to.equal(2);
    expect(validLists[0]).to.equal(testGroups.GroupA);
    expect(validLists[1]).to.equal(testGroups.GroupB);
  });

  it("handles errors in retrieving lists", () => {
    sinon.stub(groupstore, "allGroups").throws(new Error());

    try {
      groupsService.getSubscribedGroupsForMember("admin@softwerkskammer.de");
      expect(false.to.be(true));
    } catch (e) {
      expect(e).to.exist();
    }
  });
});

describe("Groups Service (createOrSaveGroup)", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("creates a new group and saves it if there is no group with the given name", () => {
    const spy = sinon.stub(groupstore, "saveGroup").callsFake(() => {});

    groupstore.saveGroup({});
    expect(spy.calledOnce).to.be(true);
  });
});

describe("Groups Service (groupFromObject)", () => {
  it("returns a new Group object if there is no valid group data", () => {
    const result = new Group({ id: "x" });

    expect(result).to.not.be(null);
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.equal("x");
    expect(result.longName).to.be(undefined);
    expect(result.description).to.be(undefined);
    expect(result.type).to.be(undefined);
  });

  it("returns a valid Group object if there is valid group data", () => {
    const result = new Group({
      id: "crafterswap",
      longName: "Crafter Swaps",
      description: "A group for organizing CS",
      type: "Themengruppe",
    });

    expect(result).to.not.be(null);
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.equal("crafterswap");
    expect(result.longName).to.equal("Crafter Swaps");
    expect(result.description).to.equal("A group for organizing CS");
    expect(result.type).to.equal("Themengruppe");
  });
});

describe("Groups Service (allGroupColors)", () => {
  const groups = groupsForTest();
  const GroupA = groups.GroupA;
  const GroupB = groups.GroupB;

  afterEach(() => {
    sinon.restore();
  });

  it("returns an object with group id and color", () => {
    GroupA.color = "#FFFFFF";
    GroupB.color = "#AAAAAA";
    sinon.stub(groupstore, "allGroups").returns([GroupA, GroupB]);

    const colorMap = groupsService.allGroupColors();
    expect(colorMap).to.have.ownProperty("groupa", "#FFFFFF");
    expect(colorMap).to.have.ownProperty("groupb", "#AAAAAA");
  });

  it("handles an error gracefully", () => {
    sinon.stub(groupstore, "allGroups").throws(new Error());

    try {
      groupsService.allGroupColors();
      expect(true).to.be(false);
    } catch (e) {
      expect(e).to.exist();
    }
  });
});

describe("Groups Service (isGroupNameAvailable)", () => {
  const groups = groupsForTest();
  const GroupA = groups.GroupA;
  const GroupB = groups.GroupB;

  before(() => {
    sinon.stub(groupstore, "getGroup").callsFake((groupname) => {
      if (groupname === "GroupA") {
        return GroupA;
      } else if (groupname === "GroupB") {
        return GroupB;
      } else if (groupname === "ErrorGroup") {
        throw new Error("Ouch! Something bad happened...");
      } else {
        return null;
      }
    });
  });

  after(() => {
    sinon.restore();
  });

  it("handles Errors", () => {
    try {
      groupsService.isGroupNameAvailable("ErrorGroup");
      expect(false).to.be(true);
    } catch (e) {
      expect(e).to.exist();
    }
  });

  it("returns false when there is already a group of this name present", () => {
    const result = groupsService.isGroupNameAvailable("GroupA");
    expect(result).to.not.be(null);
    expect(result).to.be(false);
  });

  it("returns true when there is no group of this name present", () => {
    const result = groupsService.isGroupNameAvailable("MyGroup");
    expect(result).to.not.be(null);
    expect(result).to.be(true);
  });

  it("returns an error when the group fetching is not successful", () => {
    try {
      groupsService.isGroupNameAvailable("ErrorGroup");
      expect(false).to.be(true);
    } catch (e) {
      expect(e).to.not.be(null);
    }
  });

  it("rejects groupnames that contain special characters", () => {
    expect(groupsService.isReserved("Sch adar")).to.be(true);
    expect(groupsService.isReserved("Sch/adar")).to.be(true);
    expect(groupsService.isReserved("Schad\nar")).to.be(true);
    expect(groupsService.isReserved("Schad@r")).to.be(true);

    const result = groupsService.isGroupNameAvailable("Scha dar");
    expect(result).to.be(false);
  });

  it("allows groupnames that contain alphanumeric characters only", () => {
    expect(groupsService.isReserved("Schad_r")).to.be(false);
    expect(groupsService.isReserved("Schadar")).to.be(false);

    const result = groupsService.isGroupNameAvailable("Schadar");
    expect(result).to.be(true);
  });

  it("rejects groupnames that contain reserved routes", () => {
    expect(groupsService.isReserved("new")).to.be(true);
    expect(groupsService.isReserved("submit")).to.be(true);
    expect(groupsService.isReserved("administration")).to.be(true);
    expect(groupsService.isReserved("edit")).to.be(true);
    expect(groupsService.isReserved("checkgroupname")).to.be(true);

    const result = groupsService.isGroupNameAvailable("edit");
    expect(result).to.be(false);
  });
});

describe("Groups Service (isEmailPrefixAvailable)", () => {
  it("returns false for an undefined prefix", () => {
    const result = groupsService.isEmailPrefixAvailable(undefined);
    expect(result).to.be(false);
  });

  it("returns false for a null prefix", () => {
    const result = groupsService.isEmailPrefixAvailable(null);
    expect(result).to.be(false);
  });

  it("returns false for an empty prefix", () => {
    const result = groupsService.isEmailPrefixAvailable("");
    expect(result).to.be(false);
  });
});
