"use strict";

require("../../testutil/configureForTest");

const request = require("supertest");
const sinon = require("sinon").createSandbox();

const Activity = require("../../lib/activities/activity");
const activitiesService = require("../../lib/activities/activitiesService");
const waitinglistService = require("../../lib/waitinglist/waitinglistService");

const app = require("../../testutil/testHelper")("waitinglist").createApp({ id: "superuser" });

describe("Waitinglist application", () => {
  beforeEach(() => {
    sinon.stub(activitiesService, "getActivityWithGroupAndParticipants").callsFake((url) => {
      return new Activity({ url, title: "Activity's Title" });
    });
    sinon.stub(waitinglistService, "waitinglistFor").returns([]);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("shows the waitinglist as retrieved from the store", (done) => {
    request(app)
      .get("/activity")
      .expect(200)
      .expect(/<h2>Activity's Title/)
      .expect(/<small>Warteliste/)
      .expect(/activities\/activity/)
      .expect(/Für die gewählten Wartelisteneinträge /)
      .expect(/title/, done);
  });
});
