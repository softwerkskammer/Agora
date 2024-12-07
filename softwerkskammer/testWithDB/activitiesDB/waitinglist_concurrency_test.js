"use strict";

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const persistence = require("../../lib/activities/activitiesPersistence");
const activitystore = require("../../lib/activities/activitystore");
const memberstore = require("../../lib/members/memberstore");
const mailsenderService = require("../../lib/mailsender/mailsenderService");
const waitinglistService = require("../../lib/waitinglist/waitinglistService");

const Activity = require("../../lib/activities/activity");
const Member = require("../../lib/members/member");

const activityUrl = "urlOfTheActivity";

function getActivity(url) {
  const activityState = persistence.getByField({ key: "url", val: url });
  return new Activity(activityState);
}

describe("Waitinglist Service with DB", () => {
  let activityBeforeConcurrentAccess;
  let activityAfterConcurrentAccess;
  let invocation;

  beforeEach(() => {
    // if this fails, you need to start your mongo DB
    activityBeforeConcurrentAccess = new Activity({
      id: "activityId",
      url: activityUrl,
      resources: {
        Veranstaltung: {
          _registeredMembers: [],
          _waitinglist: [{ _memberId: "memberIdWaiting" }],
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
          _registeredMembers: [{ memberId: "memberId1" }],
          _waitinglist: [{ _memberId: "memberIdWaiting" }],
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

    sinon.stub(memberstore, "getMember").callsFake((nickname) => {
      if (nickname === "nick") {
        return new Member({ id: "memberIdNew" });
      }
      if (nickname === "waiting") {
        return new Member({ id: "memberIdWaiting" });
      }
      throw new Error("Member " + nickname + " not found.");
    });

    sinon.stub(mailsenderService, "sendRegistrationAllowed");

    persistence.recreateForTest();
    // save our activity with one registrant
    activitystore.saveActivity(activityAfterConcurrentAccess);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("saveWaitinglistEntry keeps the registrant that is in the database although it only reads an activity without registrant", () => {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    waitinglistService.saveWaitinglistEntry({ nickname: "nick", activityUrl, resourcename: "Veranstaltung" });
    const activity = getActivity(activityUrl);
    expect(
      activity.resourceNamed("Veranstaltung").waitinglistEntries()[0].registrantId(),
      "Waiting member is still in the waitinglist",
    ).to.equal("memberIdWaiting");
    expect(
      activity.resourceNamed("Veranstaltung").waitinglistEntries()[1].registrantId(),
      "New member is stored in the waitinglist",
    ).to.equal("memberIdNew");
    expect(
      activity.resourceNamed("Veranstaltung").registeredMembers(),
      "First registered member is still there",
    ).to.contain("memberId1");
  });

  it("allowRegistrationForWaitinglistEntry keeps the registrant that is in the database although it only reads an activity without registrant", () => {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first 'getActivity'.
    waitinglistService.allowRegistrationForWaitinglistEntry({
      nickname: "waiting",
      activityUrl,
      resourcename: "Veranstaltung",
      hoursstring: "10",
    });
    const activity = getActivity(activityUrl);
    expect(
      activity.resourceNamed("Veranstaltung").waitinglistEntries()[0].canSubscribe(),
      "Waiting member is now allowed to subscribe",
    ).to.be(true);
    expect(
      activity.resourceNamed("Veranstaltung").registeredMembers(),
      "First registered member is still there",
    ).to.contain("memberId1");
  });
});
