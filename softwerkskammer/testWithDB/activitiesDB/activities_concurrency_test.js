"use strict";

require("../../testutil/configureForTestWithDB");

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const persistence = require("../../lib/activities/activitiesPersistence");
const activitystore = require("../../lib/activities/activitystore");
const activitiesService = require("../../lib/activities/activitiesService");
const notifications = require("../../lib/notifications");

const Activity = require("../../lib/activities/activity");

const activityUrl = "urlOfTheActivity";

const getActivity = (url) => {
  const activityState = persistence.getByField({ key: "url", val: url });
  return new Activity(activityState);
};

describe("Activities Service with DB", () => {
  let activityBeforeConcurrentAccess;
  let activityAfterConcurrentAccess;
  let invocation;

  beforeEach(async () => {
    // if this fails, you need to start your mongo DB
    activityBeforeConcurrentAccess = new Activity({
      id: "activityId",
      url: activityUrl,
      resources: {
        Veranstaltung: {
          _registeredMembers: [{ memberId: "memberIdX" }],
          _waitinglist: [{ _memberId: "memberIdY" }],
          _registrationOpen: true,
        },
      },
      version: 1,
    });

    activityAfterConcurrentAccess = new Activity({
      id: "activityId",
      url: activityUrl,
      resources: {
        Veranstaltung: {
          _registeredMembers: [{ memberId: "memberId1" }, { memberId: "memberIdX" }],
          _waitinglist: [{ _memberId: "memberIdY" }],
          _registrationOpen: true,
        },
      },
      version: 2,
    });

    invocation = 1;

    sinon.stub(activitystore, "getActivity").callsFake(() => {
      // on the first invocation, getActivity returns an activity without registrant to mimick a racing condition.
      if (invocation === 1) {
        invocation = 2;
        return activityBeforeConcurrentAccess;
      }
      // on subsequent invocations, getActivity returns an activity with registrant.
      return activityAfterConcurrentAccess;
    });

    persistence.recreateForTest();
    // save our activity with one registrant
    activitystore.saveActivity(activityAfterConcurrentAccess);

    sinon.stub(notifications, "visitorRegistration");
    sinon.stub(notifications, "visitorUnregistration");
    sinon.stub(notifications, "waitinglistAddition");
    sinon.stub(notifications, "waitinglistRemoval");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("addVisitor keeps the registrant that is in the database although it only reads an activity without registrant", async () => {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    await activitiesService.addVisitorTo("memberId2", "activity-url", Date.now());
    const activity = getActivity(activityUrl);
    expect(
      activity.resourceNamed("Veranstaltung").registeredMembers(),
      "Second registered member is stored in the database",
    ).to.contain("memberId2");
    expect(
      activity.resourceNamed("Veranstaltung").registeredMembers(),
      "First registered member is still there",
    ).to.contain("memberId1");
  });

  it("removeVisitor keeps the registrant that is in the database although it only reads an activity without registrant", async () => {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first 'getActivity'.
    await activitiesService.removeVisitorFrom("memberIdX", activityUrl);
    const activity = getActivity(activityUrl);
    expect(
      activity.resourceNamed("Veranstaltung").registeredMembers(),
      "Second removed member is no longer in the database",
    ).to.not.contain("memberIdX");
    expect(
      activity.resourceNamed("Veranstaltung").registeredMembers(),
      "First registered member is still there",
    ).to.contain("memberId1");
  });

  it("addToWaitinglist keeps the registrant that is in the database although it only reads an activity without registrant", async () => {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    await activitiesService.addToWaitinglist("memberId2", activityUrl, Date.now());
    const activity = getActivity(activityUrl);
    expect(
      activity.resourceNamed("Veranstaltung").waitinglistEntries()[0].registrantId(),
      "Previous member is still in the waitinglist",
    ).to.equal("memberIdY");
    expect(
      activity.resourceNamed("Veranstaltung").waitinglistEntries()[1].registrantId(),
      "Second member is stored in the waitinglist",
    ).to.equal("memberId2");
    expect(
      activity.resourceNamed("Veranstaltung").registeredMembers(),
      "First registered member is still there",
    ).to.contain("memberId1");
  });

  it("removeFromWaitinglist keeps the registrant that is in the database although it only reads an activity without registrant", async () => {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    await activitiesService.removeFromWaitinglist("memberIdY", activityUrl);
    const activity = getActivity(activityUrl);
    expect(
      activity.resourceNamed("Veranstaltung").waitinglistEntries().length,
      "Waitinglist member is no longer in the database",
    ).to.equal(0);
    expect(
      activity.resourceNamed("Veranstaltung").registeredMembers(),
      "First registered member is still there",
    ).to.contain("memberId1");
  });
});
