"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const groupstore = beans.get("groupstore");
const persistence = beans.get("groupsPersistence");
const Group = beans.get("group");

describe("Groups application with DB", () => {
  describe("getGroupsWithMeetupURL", () => {
    const group1 = new Group({ id: "withouturl" });
    const group2 = new Group({ id: "withnullurl", meetupURL: null });
    const group3 = new Group({ id: "withundefinedurl", meetupURL: undefined });
    const group4 = new Group({ id: "withemptyurl", meetupURL: "" });
    const group5 = new Group({ id: "withurl", meetupURL: "https://my.meetup.org/group/" });

    beforeEach(async () => {
      // if this fails, you need to start your mongo DB
      await persistence.recreateForTest();
      await groupstore.saveGroup(group1);
      await groupstore.saveGroup(group2);
      await groupstore.saveGroup(group3);
      await groupstore.saveGroup(group4);
      await groupstore.saveGroup(group5);
    });

    it("returns only the group that has a nonempty URL", async () => {
      const groups = await groupstore.getGroupsWithMeetupURL();
      expect(groups).to.have.length(1);
      expect(groups[0].id).to.be("withurl");
    });
  });
});
