"use strict";

require("../../testutil/configureForTest");

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const wikiService = require("../../lib/wiki/wikiService");
const groupsAndMembersService = require("../../lib/groupsAndMembers/groupsAndMembersService");
const activitiesService = require("../../lib/activities/activitiesService");

const dashboardService = require("../../lib/dashboard/dashboardService");

describe("Dashboard Service", () => {
  const NOT_FOUND = "notfound";
  const CRASH_ACTIVITY = "crash activity";
  let member;
  let activity1;
  let activity2;

  beforeEach(() => {
    member = { membername: "membername" };
    activity1 = { activity: 1 };
    activity2 = { activity: 2 };
    sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").callsFake((nickname) => {
      if (nickname === NOT_FOUND) {
        return null;
      }
      if (nickname === CRASH_ACTIVITY) {
        return CRASH_ACTIVITY;
      }
      return member;
    });
    sinon.stub(activitiesService, "getUpcomingActivitiesOfMemberAndHisGroups").callsFake((mem) => {
      if (mem === CRASH_ACTIVITY) {
        throw new Error();
      }
      return [activity1, activity2];
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("collects information from other Services when no subscribed groups exist", async () => {
    const result = await dashboardService.dataForDashboard("nick");
    expect(result.member).to.equal(member);
    expect(result.activities).to.contain(activity1);
    expect(result.activities).to.contain(activity2);
    expect(result.postsByGroup).to.be.empty();
    expect(result.changesByGroup).to.be.empty();
  });

  it("handles the error when no member for nickname found", async () => {
    try {
      await dashboardService.dataForDashboard(NOT_FOUND);
      expect(true).to.be(false);
    } catch (e) {
      expect(e).to.exist();
    }
  });

  it("handles the error when searching activities fails", async () => {
    try {
      await dashboardService.dataForDashboard(CRASH_ACTIVITY);
      expect(true).to.be(false);
    } catch (e) {
      expect(e).to.exist();
    }
  });

  describe("wiki", () => {
    const CRASH_BLOG = "crash blogs";
    const CRASH_CHANGE = "crash changes";
    const blogs = ["blog1", "blog2"];
    const changedFiles = ["change1", "change2"];

    beforeEach(() => {
      sinon.stub(wikiService, "getBlogpostsForGroup").callsFake((groupid) => {
        if (groupid === CRASH_BLOG) {
          throw new Error();
        }
        return blogs;
      });
      sinon.stub(wikiService, "listChangedFilesinDirectory").callsFake((groupid) => {
        if (groupid === CRASH_CHANGE) {
          throw new Error();
        }
        return changedFiles;
      });
    });

    it("collects wiki information", async () => {
      member.subscribedGroups = [{ id: "group" }];
      const result = await dashboardService.dataForDashboard("nick");
      expect(result.postsByGroup).to.have.keys(["group"]);
      expect(result.postsByGroup.group).to.contain("blog1");
      expect(result.postsByGroup.group).to.contain("blog2");
      expect(result.changesByGroup).to.have.keys(["group"]);
      expect(result.changesByGroup.group).to.contain("change1");
      expect(result.changesByGroup.group).to.contain("change2");
    });

    it("handles the error when searching blogposts crashes", async () => {
      member.subscribedGroups = [{ id: CRASH_BLOG }];
      try {
        await dashboardService.dataForDashboard("nick");
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it("handles the error when searching wiki changes crashes", async () => {
      member.subscribedGroups = [{ id: CRASH_CHANGE }];
      try {
        await dashboardService.dataForDashboard("nick");
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });
  });

  describe("partitions groups to columns by height", () => {
    it("for less than three groups", () => {
      const group1 = { id: 1 };
      const group2 = { id: 2 };
      const groups = [group1, group2];
      const linesPerGroup = { 1: 5, 2: 2 };
      const result = dashboardService.groupsByColumns(groups, linesPerGroup);
      expect(result).to.have.length(3);
      expect(result[0]).to.contain(group1);
      expect(result[1]).to.contain(group2);
      expect(result[2]).to.be.empty();
    });

    it("for three groups of equal height", () => {
      const group1 = { id: 1 };
      const group2 = { id: 2 };
      const group3 = { id: 3 };
      const groups = [group1, group2, group3];
      const linesPerGroup = { 1: 2, 2: 2, 3: 2 };
      const result = dashboardService.groupsByColumns(groups, linesPerGroup);
      expect(result).to.have.length(3);
      expect(result[0]).to.contain(group1);
      expect(result[1]).to.contain(group2);
      expect(result[2]).to.contain(group3);
    });

    it("for three groups of different height (case 1)", () => {
      const group1 = { id: 1 };
      const group2 = { id: 2 };
      const group3 = { id: 3 };
      const groups = [group1, group2, group3];
      const linesPerGroup = { 1: 3, 2: 2, 3: 1 };
      const result = dashboardService.groupsByColumns(groups, linesPerGroup);
      expect(result).to.have.length(3);
      expect(result[0]).to.contain(group1);
      expect(result[1]).to.contain(group2);
      expect(result[2]).to.contain(group3);
    });

    it("for three groups of different height (case 2)", () => {
      const group1 = { id: 1 };
      const group2 = { id: 2 };
      const group3 = { id: 3 };
      const groups = [group1, group2, group3];
      const linesPerGroup = { 1: 1, 2: 2, 3: 3 };
      const result = dashboardService.groupsByColumns(groups, linesPerGroup);
      expect(result).to.have.length(3);
      expect(result[0]).to.contain(group1);
      expect(result[0]).to.contain(group2);
      expect(result[1]).to.contain(group3);
      expect(result[2]).to.be.empty();
    });
  });
});
