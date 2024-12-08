"use strict";

require("../../testutil/configureForTest");

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const fieldHelpers = require("../../lib/commons/fieldHelpers");
const persistence = require("../../lib/activities/activitiesPersistence");
const store = require("../../lib/activities/activitystore");
const Activity = require("../../lib/activities/activity");
const Resource = require("../../lib/activities/resource");
const SoCraTesActivity = require("../../lib/activities/socratesActivity");

describe("Activity store", () => {
  const activity1 = { title: "CodingDojo1", url: "CodingDojo1", description: "bli" };
  const activity2 = { title: "CodingDojo2", url: "CodingDojo2", description: "bla" };
  const socrates = {
    id: "socratesId",
    title: "SoCraTes",
    description: "Coolest event ever :-)",
    location: "Right next door",
    url: "socrates-url",
    isSoCraTes: true,
    startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.02.2014").toJSDate(),
    endDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("15.02.2014").toJSDate(),
    owner: { nickname: "ownerNick" },
    assignedGroup: "assignedGroup",
    group: { groupLongName: "longName" },
  };
  let sampleList;
  let getByField;
  let getById;
  let list;

  beforeEach(() => {
    sampleList = [activity1, activity2];
    list = sinon.stub(persistence, "list").returns(sampleList);
    sinon.stub(persistence, "listByWhere").returns(sampleList);
    getByField = sinon.stub(persistence, "getByField").returns(activity1);
    getById = sinon.stub(persistence, "getById").callsFake((id) => {
      if (id === "socrates") {
        return socrates;
      }
      return activity1;
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("calls persistence.list for store.allActivities and transforms the result to an Activity", () => {
    const activities = store.allActivities();
    expect(activities[0].title()).to.equal(activity1.title);
    expect(activities[1].title()).to.equal(activity2.title);
    expect(activities[0].descriptionHTML()).to.contain("bli");
    expect(activities[1].descriptionHTML()).to.contain("bla");
  });

  it("calls persistence.list for store.allActivities and transforms the result to an Activity", () => {
    const activities = store.allActivities();
    expect(activities[0].title()).to.equal(activity1.title);
    expect(activities[1].title()).to.equal(activity2.title);
    expect(activities[0].descriptionHTML()).to.contain("bli");
    expect(activities[1].descriptionHTML()).to.contain("bla");
  });

  it("calls persistence.getByField for store.getActivity and transforms the result to an Activity", () => {
    const url = activity1.url;
    const activity = store.getActivity(url);
    expect(activity.title()).to.equal(activity1.title);
    expect(
      getByField.calledWith({
        key: "url",
        val: url,
      }),
    ).to.be(true);
    expect(activity.descriptionHTML()).to.contain("bli");
  });

  it("calls persistence.getById for store.getActivityForId and transforms the result to an Activity", () => {
    const id = "id";
    const activity = store.getActivityForId(id);
    expect(activity.title()).to.equal(activity1.title);
    expect(getById.calledWith(id)).to.be(true);
    expect(activity.descriptionHTML()).to.contain("bli");
  });

  it("returns an activity object for the given id although the persistence only returns a JS object", () => {
    getByField.restore();
    sinon.stub(persistence, "getByField").returns({ url: "activityUrl" });

    const result = store.getActivity("activityUrl");
    expect(result.url()).to.equal("activityUrl");
  });

  it("returns null when id does not exist", () => {
    getByField.restore();
    sinon.stub(persistence, "getByField");

    const result = store.getActivity(1234);
    expect(result).to.be(null);
  });

  it("returns undefined when persistence yields an error", () => {
    getByField.restore();
    sinon.stub(persistence, "getByField").throws(new Error("error"));

    try {
      store.getActivity(1234);
      expect(true).to.be(false);
    } catch (e) {
      expect(e).to.exist();
    }
  });

  it("returns all activites although the persistence only returns JS objects", () => {
    list.restore();
    sinon.stub(persistence, "list").returns([{ url: "activityUrl" }]);

    const activities = store.allActivities();
    expect(activities).to.have.length(1);
    expect(activities[0].url()).to.equal("activityUrl");
  });

  it("returns upcoming activities", () => {
    const result = store.upcomingActivities();
    expect(result).to.have.length(2);
  });

  it("returns past activities", () => {
    const result = store.pastActivities();
    expect(result).to.have.length(2);
  });

  it("calls persistence.remove for store.removeActivity and passes on the given callback", () => {
    const remove = sinon.stub(persistence, "removeById");
    const activity = new Activity(activity1);
    activity.state.id = "I D";
    store.removeActivity(activity);
    expect(remove.calledWith("I D")).to.be(true);
  });

  describe("builds a SoCraTesActivity", () => {
    const id = "socrates";
    it("on fetching a single activity - when the isSoCraTes flag is set", () => {
      const activity = store.getActivityForId(id);
      expect(activity).to.be.a(SoCraTesActivity);
    });

    it("on fetching all activities - when the isSoCraTes flag is set", () => {
      list.restore();
      sinon.stub(persistence, "list").returns([socrates]);

      const activities = store.allActivities();
      expect(activities[0]).to.be.a(SoCraTesActivity);
    });

    it("that shows all required data for the overview and the calendar in SWK and for display and edit in SoCraTes", () => {
      const activity = store.getActivityForId(id);
      expect(activity.id()).to.equal("socratesId");
      expect(activity.title()).to.equal("SoCraTes");
      expect(activity.startDateTime().toString()).to.equal("2014-02-01T00:00:00.000+01:00");
      expect(activity.endDateTime().toString()).to.equal("2014-02-15T00:00:00.000+01:00");
      expect(activity.fullyQualifiedUrl()).to.equal("https://socrates.com:12345");
      expect(activity.url()).to.equal("socrates-url");
      expect(activity.allRegisteredMembers()).to.eql([]);
      expect(activity.resourceNames()).to.eql(["Veranstaltung"]);
      expect(activity.resourceNamed("Veranstaltung")).to.eql(
        new Resource(
          {
            _registeredMembers: [],
            _registrationOpen: true,
          },
          "Veranstaltung",
        ),
      );
      expect(activity.isMultiDay()).to.be(true);
      expect(activity.location()).to.be("Right next door");
      expect(activity.assignedGroup()).to.be("G");
      expect(activity.owner()).to.eql({ nickname: "ownerNick" });
      expect(activity.groupName()).to.be(undefined);
      expect(activity.colorFrom()).to.equal("#3771C8"); // fixed SoCraTes color
      expect(activity.groupFrom()).to.equal(undefined);
    });
  });
});
