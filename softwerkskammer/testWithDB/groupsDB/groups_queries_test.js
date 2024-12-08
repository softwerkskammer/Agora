"use strict";

require("../../testutil/configureForTest");

const expect = require("must-dist");

const groupstore = require("../../lib/groups/groupstore");
const persistence = require("../../lib/groups/groupsPersistence");
const Group = require("../../lib/groups/group");

describe("Groups application with DB", () => {
  describe("getGroupsWithMeetupURL", () => {
    const group1 = new Group({ id: "withouturl" });
    const group2 = new Group({ id: "withnullurl", meetupURL: null });
    const group3 = new Group({ id: "withundefinedurl", meetupURL: undefined });
    const group4 = new Group({ id: "withemptyurl", meetupURL: "" });
    const group5 = new Group({ id: "withurl", meetupURL: "https://my.meetup.org/group/" });

    beforeEach(() => {
      // if this fails, you need to start your mongo DB
      persistence.recreateForTest();
      groupstore.saveGroup(group1);
      groupstore.saveGroup(group2);
      groupstore.saveGroup(group3);
      groupstore.saveGroup(group4);
      groupstore.saveGroup(group5);
    });

    it("returns only the group that has a nonempty URL", () => {
      const groups = groupstore.getGroupsWithMeetupURL();
      expect(groups).to.have.length(1);
      expect(groups[0].id).to.be("withurl");
    });
  });
});
