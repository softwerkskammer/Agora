"use strict";

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const activitystore = beans.get("activitystore");
const persistence = beans.get("activitiesPersistence");
const Activity = beans.get("activity");

describe("Activity application with DB - shows activities where a member is organizer or editor -", () => {
  const tomorrowEarly = new Date(Date.now() + 86400000); // + 1 day
  const tomorrowLate = new Date(Date.now() + 90000000); // + 1 day + 1 hour
  const dayAfterTomorrow = new Date(Date.now() + 86400000 + 86400000); // + 2 days
  const yesterday = new Date(Date.now() - 86400000); // - 1 day
  const dayBeforeYesterday = new Date(Date.now() - 86400000 - 86400000); // - 2 days

  const futureActivityOwner1NoEditorIds = new Activity({
    id: "futureActivity1",
    title: "Future Activity 1",
    description: "description1",
    assignedGroup: "groupname1",
    location: "location1",
    direction: "direction1",
    startDate: tomorrowEarly,
    endDate: dayAfterTomorrow,
    url: "url_future",
    owner: "owner1",
    resources: {
      Veranstaltung: { _registeredMembers: [{ memberId: "memberId2" }], _registrationOpen: true },
      AndereVeranstaltung: { _registeredMembers: [{ memberId: "memberId2" }], _registrationOpen: true },
    },
    version: 1,
  });

  const futureActivityOwner2EmptyEditorIds = new Activity({
    id: "futureActivity2",
    title: "Future Activity 2",
    description: "description1",
    assignedGroup: "groupname2",
    location: "location1",
    direction: "direction1",
    startDate: tomorrowLate,
    endDate: dayAfterTomorrow,
    url: "url_future",
    owner: "owner2",
    editorIds: [],
    resources: { Veranstaltung: { _registeredMembers: [{ memberId: "memberId" }], _registrationOpen: true } },
    version: 1,
  });

  const currentActivityOwner2EditorOwner1 = new Activity({
    id: "currentActivity1",
    title: "Current Activity 1",
    description: "description1",
    assignedGroup: "groupname1",
    location: "location1",
    direction: "direction1",
    startDate: yesterday,
    endDate: tomorrowEarly,
    url: "url_current",
    owner: "owner2",
    editorIds: ["owner1", "otherperson", "yetanother"],
    resources: { Veranstaltung: { _registeredMembers: [{ memberId: "memberId" }], _registrationOpen: true } },
    version: 1,
  });

  const pastActivityOwner3EditorOwner3 = new Activity({
    id: "pastActivity1",
    title: "Past Activity 1",
    description: "description1",
    assignedGroup: "groupname",
    location: "location1",
    direction: "direction1",
    startDate: dayBeforeYesterday,
    endDate: yesterday,
    url: "url_past",
    owner: "owner3",
    editorIds: ["owner3"],
    resources: { Veranstaltung: { _registeredMembers: [{ memberId: "memberId" }], _registrationOpen: true } },
    version: 1,
  });

  beforeEach((done) => {
    // if this fails, you need to start your mongo DB

    persistence.drop(() => {
      activitystore.saveActivity(futureActivityOwner1NoEditorIds, (err) => {
        if (err) {
          done(err);
        }
        activitystore.saveActivity(futureActivityOwner2EmptyEditorIds, (err1) => {
          if (err1) {
            done(err1);
          }
          activitystore.saveActivity(currentActivityOwner2EditorOwner1, (err2) => {
            if (err2) {
              done(err2);
            }
            activitystore.saveActivity(pastActivityOwner3EditorOwner3, (err3) => {
              done(err3);
            });
          });
        });
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("no activities for members who are neither owners nor editors", (done) => {
    activitystore.organizedOrEditedActivitiesForMemberId("no-owner-and-no-editor", (err, activities) => {
      expect(activities.length).to.equal(0);
      done(err);
    });
  });

  it("shows activities where owner1 is owner or editor, oldest last", (done) => {
    activitystore.organizedOrEditedActivitiesForMemberId("owner1", (err, activities) => {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal("Future Activity 1");
      expect(activities[1].title()).to.equal("Current Activity 1");
      done(err);
    });
  });

  it("if a person is owner and editor, the activity only appears once", (done) => {
    activitystore.organizedOrEditedActivitiesForMemberId("owner3", (err, activities) => {
      expect(activities.length).to.equal(1);
      expect(activities[0].title()).to.equal("Past Activity 1");
      done(err);
    });
  });
});

describe("Activity application with DB - organizedOrEditedActivitiesForMemberId without activities -", () => {
  beforeEach((done) => {
    // if this fails, you need to start your mongo DB
    persistence.drop(done);
  });

  it("returns an empty list if there is no collection at all", (done) => {
    activitystore.organizedOrEditedActivitiesForMemberId("unknownMemberId", (err, activities) => {
      expect(err).to.not.exist();
      expect(activities.length).to.equal(0);
      done(err);
    });
  });
});
