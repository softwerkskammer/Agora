"use strict";

const request = require("supertest");
const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const fieldHelpers = beans.get("fieldHelpers");
const activitystore = beans.get("activitystore");
const persistence = beans.get("activitiesPersistence");
const Activity = beans.get("activity");

const createApp = require("../../testutil/testHelper")("activitiesApp", beans).createApp;

function getActivity(url) {
  return new Activity(persistence.getByField({ key: "url", val: url }));
}

describe("Activity application with DB - on submit -", () => {
  let activityBeforeConcurrentAccess;
  let activityAfterConcurrentAccess;

  beforeEach(async () => {
    activityBeforeConcurrentAccess = new Activity({
      id: "activityId",
      title: "Title of the Activity",
      description: "description1",
      assignedGroup: "groupname",
      location: "location1",
      direction: "direction1",
      startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.01.2013").toJSDate(),
      url: "urlOfTheActivity",
      owner: "owner",
      resources: { Veranstaltung: { _registeredMembers: [], _registrationOpen: true } },
      version: 1,
    });

    activityAfterConcurrentAccess = new Activity({
      id: "activityId",
      title: "Title of the Activity",
      description: "description1",
      assignedGroup: "groupname",
      location: "location1",
      direction: "direction1",
      startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.01.2013").toJSDate(),
      url: "urlOfTheActivity",
      owner: "owner",
      resources: {
        Veranstaltung: {
          _registeredMembers: [{ memberId: "memberId1" }],
          _registrationOpen: true,
        },
      },
      version: 2,
    });

    sinon.stub(activitystore, "getActivity").returns(activityBeforeConcurrentAccess);

    await persistence.recreateForTest();
    // save our activity with one registrant
    await activitystore.saveActivity(activityAfterConcurrentAccess);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("rejects an activity if there is a race condition on save", () => {
    request(createApp("memberId"))
      .post("/submit")
      .send(
        "url=urlOfTheActivity&previousUrl=urlOfTheActivity&assignedGroup=alle&location=location2&title=Title 2&startDate=02.07.2000&startTime=19:00&endDate=02.07.2000&endTime=21:00&resources[names]=Veranstaltung",
      )
      .expect(302)
      .expect(/Redirecting to \/activities\/edit\/urlOfTheActivity/, async (err) => {
        // check that activity did not get changed on the database
        const activity = getActivity("urlOfTheActivity");
        expect(
          activity.resourceNamed("Veranstaltung").registeredMembers(),
          "Registered member is still there",
        ).to.contain("memberId1");
        expect(activity.location(), "Old location was not overwritten").to.equal("location1");
        if (err) {
          throw err;
        }
      });
  });
});
