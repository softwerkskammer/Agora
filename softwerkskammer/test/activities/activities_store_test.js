"use strict";

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const beans = require("../../testutil/configureForTest").get("beans");
const fieldHelpers = beans.get("fieldHelpers");
const persistence = beans.get("activitiesPersistence");
const store = beans.get("activitystore");
const Activity = beans.get("activity");
const Resource = beans.get("resource");
const SoCraTesActivity = beans.get("socratesActivity");

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
    list = sinon.stub(persistence, "listAsync").returns(sampleList);
    sinon.stub(persistence, "listByField").callsFake((searchObject, sortOrder, callback) => callback(null, sampleList));
    sinon.stub(persistence, "listByFieldAsync").returns(sampleList);
    getByField = sinon.stub(persistence, "getByFieldAsync").returns(activity1);
    getById = sinon.stub(persistence, "getById").callsFake((id, callback) => {
      if (id === "socrates") {
        return callback(null, socrates);
      }
      return callback(null, activity1);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("calls persistence.list for store.allActivities and transforms the result to an Activity", async () => {
    const activities = await store.allActivitiesAsync();
    expect(activities[0].title()).to.equal(activity1.title);
    expect(activities[1].title()).to.equal(activity2.title);
    expect(activities[0].descriptionHTML()).to.contain("bli");
    expect(activities[1].descriptionHTML()).to.contain("bla");
  });

  it("calls persistence.list for store.allActivities and transforms the result to an Activity", async () => {
    const activities = await store.allActivitiesAsync();
    expect(activities[0].title()).to.equal(activity1.title);
    expect(activities[1].title()).to.equal(activity2.title);
    expect(activities[0].descriptionHTML()).to.contain("bli");
    expect(activities[1].descriptionHTML()).to.contain("bla");
  });

  it("calls persistence.getByField for store.getActivity and transforms the result to an Activity", async () => {
    const url = activity1.url;
    const activity = await store.getActivity(url);
    expect(activity.title()).to.equal(activity1.title);
    expect(getByField.calledWith({ url })).to.be(true);
    expect(activity.descriptionHTML()).to.contain("bli");
  });

  it("calls persistence.getById for store.getActivityForId and transforms the result to an Activity", (done) => {
    const id = "id";
    store.getActivityForId(id, (err, activity) => {
      expect(activity.title()).to.equal(activity1.title);
      expect(getById.calledWith(id)).to.be(true);
      expect(activity.descriptionHTML()).to.contain("bli");
      done(err);
    });
  });

  it("returns an activity object for the given id although the persistence only returns a JS object", async () => {
    getByField.restore();
    sinon.stub(persistence, "getByFieldAsync").returns({ url: "activityUrl" });

    const result = await store.getActivity("activityUrl");
    expect(result.url()).to.equal("activityUrl");
  });

  it("returns null when id does not exist", async () => {
    getByField.restore();
    sinon.stub(persistence, "getByFieldAsync");

    const result = await store.getActivity(1234);
    expect(result).to.be(null);
  });

  it("returns undefined when persistence yields an error", async () => {
    getByField.restore();
    sinon.stub(persistence, "getByFieldAsync").throws(new Error("error"));

    try {
      await store.getActivity(1234);
      expect(true).to.be(false);
    } catch (e) {
      expect(e).to.exist();
    }
  });

  it("returns all activites although the persistence only returns JS objects", async () => {
    list.restore();
    sinon.stub(persistence, "listAsync").returns([{ url: "activityUrl" }]);

    const activities = await store.allActivitiesAsync();
    expect(activities).to.have.length(1);
    expect(activities[0].url()).to.equal("activityUrl");
  });

  it("returns upcoming activities", async () => {
    const result = await store.upcomingActivities();
    expect(result).to.have.length(2);
  });

  it("returns past activities", async () => {
    const result = await store.pastActivities();
    expect(result).to.have.length(2);
  });

  it("calls persistence.remove for store.removeActivity and passes on the given callback", (done) => {
    const remove = sinon.stub(persistence, "remove").callsFake((memberId, callback) => {
      callback();
    });
    const activity = new Activity(activity1);
    activity.state.id = "I D";
    store.removeActivity(activity, (err) => {
      expect(remove.calledWith("I D")).to.be(true);
      done(err);
    });
  });

  describe("builds a SoCraTesActivity", () => {
    const id = "socrates";
    it("on fetching a single activity - when the isSoCraTes flag is set", (done) => {
      store.getActivityForId(id, (err, activity) => {
        expect(activity).to.be.a(SoCraTesActivity);
        done(err);
      });
    });

    it("on fetching all activities - when the isSoCraTes flag is set", async () => {
      list.restore();
      sinon.stub(persistence, "listAsync").returns([socrates]);

      const activities = await store.allActivitiesAsync();
      expect(activities[0]).to.be.a(SoCraTesActivity);
    });

    it("that shows all required data for the overview and the calendar in SWK and for display and edit in SoCraTes", (done) => {
      store.getActivityForId(id, (err, activity) => {
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
            "Veranstaltung"
          )
        );
        expect(activity.isMultiDay()).to.be(true);
        expect(activity.location()).to.be("Right next door");
        expect(activity.assignedGroup()).to.be("G");
        expect(activity.owner()).to.eql({ nickname: "ownerNick" });
        expect(activity.groupName()).to.be(undefined);
        expect(activity.colorFrom()).to.equal("#3771C8"); // fixed SoCraTes color
        expect(activity.groupFrom()).to.equal(undefined);
        done(err);
      });
    });

    it("flattensAndSorts a mongo result completely", () => {
      const nestedMongoResult = [
        {
          value: [
            [
              [{ startDate: new Date(3) }, { startDate: new Date(7) }, { startDate: new Date(2) }],
              { startDate: new Date(1) },
              { startDate: new Date(6) },
              { startDate: new Date(5) },
            ],
            { startDate: new Date(4) },
            { startDate: new Date(9) },
            { startDate: new Date(8) },
          ],
        },
      ];
      const result = store.flattenAndSortMongoResultCollection(nestedMongoResult);
      expect(result).to.eql([
        { startDate: new Date(1) },
        { startDate: new Date(2) },
        { startDate: new Date(3) },
        { startDate: new Date(4) },
        { startDate: new Date(5) },
        { startDate: new Date(6) },
        { startDate: new Date(7) },
        { startDate: new Date(8) },
        { startDate: new Date(9) },
      ]);
    });
  });
});
