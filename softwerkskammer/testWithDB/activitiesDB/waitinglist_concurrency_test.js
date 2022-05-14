"use strict";

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const persistence = beans.get("activitiesPersistence");
const activitystore = beans.get("activitystore");
const memberstore = beans.get("memberstore");
const mailsenderService = beans.get("mailsenderService");
const waitinglistService = beans.get("waitinglistService");

const Activity = beans.get("activity");
const Member = beans.get("member");

const activityUrl = "urlOfTheActivity";

function getActivity(url, callback) {
  persistence.getByField({ url }, (err, activityState) => {
    callback(err, new Activity(activityState));
  });
}

describe("Waitinglist Service with DB", () => {
  let activityBeforeConcurrentAccess;
  let activityAfterConcurrentAccess;
  let invocation;

  beforeEach((done) => {
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

    sinon.stub(mailsenderService, "sendRegistrationAllowed").callsFake((member, activity, entry, callback) => {
      // we don't want to send an email
      return callback(null);
    });

    persistence.drop(async () => {
      // save our activity with one registrant
      await activitystore.saveActivity(activityAfterConcurrentAccess);
      done();
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("saveWaitinglistEntry keeps the registrant that is in the database although it only reads an activity without registrant", (done) => {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    waitinglistService.saveWaitinglistEntry({ nickname: "nick", activityUrl, resourcename: "Veranstaltung" }, (err) => {
      if (err) {
        return done(err);
      }
      getActivity(activityUrl, (err1, activity) => {
        expect(
          activity.resourceNamed("Veranstaltung").waitinglistEntries()[0].registrantId(),
          "Waiting member is still in the waitinglist"
        ).to.equal("memberIdWaiting");
        expect(
          activity.resourceNamed("Veranstaltung").waitinglistEntries()[1].registrantId(),
          "New member is stored in the waitinglist"
        ).to.equal("memberIdNew");
        expect(
          activity.resourceNamed("Veranstaltung").registeredMembers(),
          "First registered member is still there"
        ).to.contain("memberId1");
        done(err1);
      });
    });
  });

  it("allowRegistrationForWaitinglistEntry keeps the registrant that is in the database although it only reads an activity without registrant", (done) => {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first 'getActivity'.
    waitinglistService.allowRegistrationForWaitinglistEntry(
      { nickname: "waiting", activityUrl, resourcename: "Veranstaltung", hoursstring: "10" },
      (err) => {
        if (err) {
          return done(err);
        }
        getActivity(activityUrl, (err1, activity) => {
          expect(
            activity.resourceNamed("Veranstaltung").waitinglistEntries()[0].canSubscribe(),
            "Waiting member is now allowed to subscribe"
          ).to.be(true);
          expect(
            activity.resourceNamed("Veranstaltung").registeredMembers(),
            "First registered member is still there"
          ).to.contain("memberId1");
          done(err1);
        });
      }
    );
  });
});
