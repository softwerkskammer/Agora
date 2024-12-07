"use strict";
const request = require("supertest");
const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const activityresultsService = require("../../lib/activityresults/activityresultsService");
const activityresultsPersistence = beans.get("activityresultsPersistence");

const createApp = require("../../testutil/testHelper")("activityresults").createApp;

const ActivityResult = require("../../lib/activityresults/activityresult");

const MEMBER_ID = "memberID";

describe("Activityresults application", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("for retrieval", () => {
    it("should return a 404 for non given result's name", (done) => {
      request(createApp()).get("/").expect(404, done);
    });

    it("should allow to create a new one with the name if not existing yet", (done) => {
      sinon.stub(activityresultsService, "getActivityResultByName");

      request(createApp())
        .get("/unknown-activity-result")
        .expect(/<h2>Neue Session Snap Sammlung<\/h2>/, done);
    });

    it("should render the results if the activity result is known", (done) => {
      sinon.stub(activityresultsService, "getActivityResultByName").callsFake(
        (activityResultName) =>
          new ActivityResult({
            id: activityResultName,
            title: "TITLE for " + activityResultName,
            photos: [
              { uri: "/gallery/fef400b5-2a1f-4f6d-86b7-d5b5716711ba.JPG", timestamp: new Date(), tags: ["hopper"] },
              { id: "73120aa1-80b1-4f2f-a342-4b03abc665e5.JPG", timestamp: new Date(), tags: ["hopper"] },
              { id: "cba13ad5-43fc-485d-a73b-7adb0138debe.JPG", timestamp: new Date(), tags: ["lovelace"] },
              { id: "627adb49-b7ef-4765-94b9-d094463007a6.JPG", timestamp: new Date(), tags: ["elsewhere"] },
              { id: "9afcfea0-1aa4-41c1-9f8c-6dba1e16d6c4.JPG", timestamp: new Date(), tags: ["elsewhere"] },
            ],
          }),
      );

      request(createApp())
        .get("/known-activity-results")
        .expect(/elsewhere/, done);
    });
  });

  describe("for creation and uploading", () => {
    it("should create a new activity result with tags", (done) => {
      let theResult;
      sinon.stub(activityresultsPersistence, "save").callsFake((activityResult) => {
        theResult = activityResult;
        return activityResult;
      });

      request(createApp({ id: MEMBER_ID }))
        .post("/")
        .type("form")
        .send({ activityResultName: "MyActivityResult", tags: "myFirstTag,mySecondTag" })
        .expect(302)
        .end((err) => {
          expect(theResult.tags).to.eql(["myFirstTag", "mySecondTag"]);
          done(err);
        });
    });

    it("should reject request without activityResultName parameter", (done) => {
      request(createApp()).post("/").type("form").expect(500, done);
    });

    it("should reject request with empty activityResultName parameter", (done) => {
      request(createApp()).post("/").type("form").send({ activityResultName: "" }).expect(500, done);
    });

    it("should store an image and redirect to edit", (done) => {
      sinon.stub(activityresultsService, "addPhotoToActivityResult").returns("my-custom-image-id");

      request(createApp({ id: "memberId" }))
        .post("/foo/upload")
        .attach("image", __filename)
        .expect(302)
        .expect("Location", /\/foo\/photo\/my-custom-image-id\/edit/)
        .end(done);
    });
  });

  describe("editing photos", () => {
    const photoId = "photo_id";
    beforeEach(() => {
      sinon.stub(activityresultsService, "getActivityResultByName").returns(
        new ActivityResult({
          id: "foo",
          name: "foobar",
          photos: [{ id: photoId, title: "mishka", uploaded_by: MEMBER_ID }],
        }),
      );
    });

    it("should have old values set", (done) => {
      request(createApp({ id: MEMBER_ID }))
        .get("/foo/photo/" + photoId + "/edit")
        .expect((res) => {
          if (res.text.indexOf("mishka") === -1) {
            return "Title not found";
          }
        })
        .end(done);
    });

    it("should not let me edit a photo I didn't upload", (done) => {
      request(createApp())
        .get("/foo/photo/" + photoId + "/edit")
        .expect(302, done);
    });

    it("should save a photos time, tags and title", (done) => {
      sinon
        .stub(activityresultsService, "updatePhotoOfActivityResult")
        .callsFake((activityResultName, photoID, data) => {
          expect(data.title).to.eql("My adventures with the softwerkskammer");
          expect(data.tags).to.eql(["a", "b"]);
        });

      request(createApp())
        .post("/foo/photo/" + photoId + "/edit")
        .type("form")
        .send({
          title: "My adventures with the softwerkskammer",
          time: "02:03",
          date: "2015-05-04",
          tags: ["a", "b"],
        })
        .expect(302)
        .expect("Location", "/foo")
        .end(done);
    });

    it("should not let me save changes to a photo if I didn't upload it", (done) => {
      sinon
        .stub(activityresultsService, "updatePhotoOfActivityResult")
        .callsFake((activityResultName, photoID, data) => {
          expect(data.title).to.eql("My adventures with the softwerkskammer");
          expect(data.tags).to.eql(["a", "b"]);
        });

      request(createApp())
        .post("/foo/photo/" + photoId + "/edit")
        .type("form")
        .send({
          title: "My adventures with the softwerkskammer",
          time: "02:03",
          date: "2015-05-04",
          tags: ["a", "b"],
        })
        .expect(302, done);
    });
  });
});
