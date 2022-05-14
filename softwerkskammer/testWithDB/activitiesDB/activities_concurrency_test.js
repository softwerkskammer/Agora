"use strict";

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const persistence = beans.get("activitiesPersistence");
const activitystore = beans.get("activitystore");
const activitiesService = beans.get("activitiesService");
const notifications = beans.get("notifications");

const Activity = beans.get("activity");

const activityUrl = "urlOfTheActivity";

const getActivity = (url, callback) => {
  persistence.getByField({ url }, (err, activityState) => callback(err, new Activity(activityState)));
};

describe("Activities Service with DB", () => {
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

    sinon.stub(activitystore, "getActivity").callsFake((url, callback) => {
      // on the first invocation, getActivity returns an activity without registrant to mimick a racing condition.
      if (invocation === 1) {
        invocation = 2;
        return callback(null, activityBeforeConcurrentAccess);
      }
      // on subsequent invocations, getActivity returns an activity with registrant.
      return callback(null, activityAfterConcurrentAccess);
    });

    persistence.drop(() => {
      // save our activity with one registrant
      activitystore.saveActivity(activityAfterConcurrentAccess, (err) => {
        done(err);
      });
    });

    sinon.stub(notifications, "visitorRegistration").callsFake((a, b, callback) => callback());
    sinon.stub(notifications, "visitorUnregistration");
    sinon.stub(notifications, "waitinglistAddition");
    sinon.stub(notifications, "waitinglistRemoval");
  });

  afterEach(() => {
    sinon.restore();
  });

  it("addVisitor keeps the registrant that is in the database although it only reads an activity without registrant", (done) => {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    activitiesService.addVisitorTo("memberId2", activityUrl, Date.now(), (err) => {
      if (err) {
        return done(err);
      }
      getActivity(activityUrl, (err1, activity) => {
        if (err1) {
          return done(err1);
        }
        expect(
          activity.resourceNamed("Veranstaltung").registeredMembers(),
          "Second registered member is stored in the database"
        ).to.contain("memberId2");
        expect(
          activity.resourceNamed("Veranstaltung").registeredMembers(),
          "First registered member is still there"
        ).to.contain("memberId1");
        done(err1);
      });
    });
  });

  it("removeVisitor keeps the registrant that is in the database although it only reads an activity without registrant", (done) => {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first 'getActivity'.
    activitiesService.removeVisitorFrom("memberIdX", activityUrl, (err) => {
      if (err) {
        return done(err);
      }
      getActivity(activityUrl, (err1, activity) => {
        if (err1) {
          return done(err1);
        }
        expect(
          activity.resourceNamed("Veranstaltung").registeredMembers(),
          "Second removed member is no longer in the database"
        ).to.not.contain("memberIdX");
        expect(
          activity.resourceNamed("Veranstaltung").registeredMembers(),
          "First registered member is still there"
        ).to.contain("memberId1");
        done(err1);
      });
    });
  });

  it("addToWaitinglist keeps the registrant that is in the database although it only reads an activity without registrant", (done) => {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    activitiesService.addToWaitinglist("memberId2", activityUrl, Date.now(), (err) => {
      if (err) {
        return done(err);
      }
      getActivity(activityUrl, (err1, activity) => {
        if (err1) {
          return done(err1);
        }
        expect(
          activity.resourceNamed("Veranstaltung").waitinglistEntries()[0].registrantId(),
          "Previous member is still in the waitinglist"
        ).to.equal("memberIdY");
        expect(
          activity.resourceNamed("Veranstaltung").waitinglistEntries()[1].registrantId(),
          "Second member is stored in the waitinglist"
        ).to.equal("memberId2");
        expect(
          activity.resourceNamed("Veranstaltung").registeredMembers(),
          "First registered member is still there"
        ).to.contain("memberId1");
        done(err1);
      });
    });
  });

  it("removeFromWaitinglist keeps the registrant that is in the database although it only reads an activity without registrant", (done) => {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    activitiesService.removeFromWaitinglist("memberIdY", activityUrl, (err) => {
      if (err) {
        return done(err);
      }
      getActivity(activityUrl, (err1, activity) => {
        if (err1) {
          return done(err1);
        }
        expect(
          activity.resourceNamed("Veranstaltung").waitinglistEntries().length,
          "Waitinglist member is no longer in the database"
        ).to.equal(0);
        expect(
          activity.resourceNamed("Veranstaltung").registeredMembers(),
          "First registered member is still there"
        ).to.contain("memberId1");
        done(err1);
      });
    });
  });
});
