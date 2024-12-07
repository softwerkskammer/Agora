"use strict";

const expect = require("must-dist");

const Activity = require("../../lib/activities/activity");
const fieldHelpers = require("../../lib/commons/fieldHelpers");

// TODO Activity.fillFromUI with null/undefined in startDate, startTime, endDate, endTime

describe("Activity", () => {
  it("fetches the group long name", () => {
    const activity = new Activity({
      url: "myURL",
      assignedGroup: "group",
    });
    const groups = [
      { id: "group", longName: "groupname" },
      { id: "other", longName: "othername" },
    ];
    activity.groupFrom(groups);
    expect(activity.groupName()).to.equal("groupname");
  });

  it("fetches a blank string if group not found", () => {
    const activity = new Activity({
      url: "myURL",
      assignedGroup: "group",
    });
    const groups = [
      { id: "each", longName: "groupname" },
      { id: "other", longName: "othername" },
    ];
    activity.groupFrom(groups);
    expect(activity.groupName()).to.equal("");
  });

  it("retrieves the color from the assigned group", () => {
    const activity = new Activity({
      url: "myURL",
      assignedGroup: "group",
    });
    const groupColors = {
      group: "#FFF",
      other: "000",
    };
    expect(activity.colorFrom(groupColors)).to.equal("#FFF");
  });

  it("retrieves the default color if the group is not present in the group colors", () => {
    const activity = new Activity({
      url: "myURL",
      assignedGroup: "group",
    });
    const groupColors = {
      other: "000",
    };
    expect(activity.colorFrom(groupColors)).to.equal("#353535");
  });

  it("retrieves the color as default if no group colors are found", () => {
    const activity = new Activity({
      url: "myURL",
    });
    expect(activity.colorFrom(null)).to.equal("#353535");
  });

  describe("blogEntryUrl", () => {
    const nov20 = fieldHelpers.parseToDateTimeUsingDefaultTimezone("20.11.2017").toJSDate();
    it("uses group id, date, and title to compose url", () => {
      const activity = new Activity({
        assignedGroup: "mygroup",
        title: "my-activity",
        startDate: nov20,
      });

      expect(activity.blogEntryUrl()).to.equal("mygroup/blog_2017-11-20_my-activity");
    });

    it("uses lower cased title", () => {
      const activity = new Activity({
        assignedGroup: "mygroup",
        title: "Myactivity",
        startDate: nov20,
      });

      expect(activity.blogEntryUrl()).to.equal("mygroup/blog_2017-11-20_myactivity");
    });

    it("replaces special characters in title with same characters", () => {
      const activity = new Activity({
        assignedGroup: "mygroup",
        title: "74. my activityÄÖÜ",
        startDate: nov20,
      });

      expect(activity.blogEntryUrl()).to.equal("mygroup/blog_2017-11-20_74-my-activityaou");
    });
  });
});

describe("Activity's owner", () => {
  it("is preserved in existing state if not given to constructor", () => {
    const activity = new Activity({ owner: "owner" });
    expect(activity.owner()).to.equal("owner");
  });
});

describe("Activity's description", () => {
  it("renders anchor tags when required", () => {
    const activity = new Activity({
      description: "[dafadf](http://a.de) https://b.de",
    });
    expect(activity.descriptionHTML()).to.contain('a href="http://a.de"');
    expect(activity.descriptionHTML()).to.contain('"https://b.de"');
  });

  it("removes anchor tags when required", () => {
    const activity = new Activity({
      description: '<a href = "http://a.de">dafadf</a> https://b.de',
    });
    expect(activity.descriptionPlain()).to.not.contain('"http://a.de"');
    expect(activity.descriptionPlain()).to.not.contain('"https://b.de"');
    expect(activity.descriptionPlain()).to.contain("dafadf");
    expect(activity.descriptionPlain()).to.contain("https://b.de");
  });
});

describe("Activity's direction", () => {
  it("knows that it doesn't contain direction", () => {
    const activity = new Activity();
    expect(activity.hasDirection()).to.be(false);
  });

  it("knows that it contains direction", () => {
    const activity = new Activity({
      direction: "direction",
    });
    expect(activity.hasDirection()).to.be(true);
  });
});

describe("Activity's editorIds", () => {
  it("returns an empty array if there are no editors in constructor object", () => {
    const activity = new Activity();
    expect(activity.editorIds()).to.eql([]);
  });

  it("returns the editorIds that are contained in constructor object", () => {
    const activity = new Activity({
      editorIds: ["abc", "def"],
    });
    expect(activity.editorIds()).to.eql(["abc", "def"]);
  });

  it("returns an empty array if there are no editorIds passed via fillFromUI", () => {
    const activity = new Activity();
    activity.fillFromUI({});
    expect(activity.editorIds()).to.eql([]);
  });

  it("returns the editorIds that are passed via fillFromUI", () => {
    const activity = new Activity();
    activity.fillFromUI({}, ["abc", "def"]);
    expect(activity.editorIds()).to.eql(["abc", "def"]);
  });
});
