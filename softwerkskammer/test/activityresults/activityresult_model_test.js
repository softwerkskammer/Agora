"use strict";

const { DateTime } = require("luxon");
const expect = require("must-dist");

const ActivityResult = require("../../testutil/configureForTest").get("beans").get("activityresult");

describe("Activity result", () => {
  it("should have an id", () => {
    const activityResult = new ActivityResult({ id: "hackergarten2_2" });
    expect(activityResult.id()).to.be("hackergarten2_2");
  });

  it("should not have an empty constructor", () => {
    expect(new ActivityResult({}).id()).to.be.falsy();
  });

  it("should have a list of photo ids", () => {
    const activityResult = new ActivityResult({
      id: "hackergarten2_2",
      photos: [{ id: "image1.jpg" }, { id: "image2.jpg" }],
    });

    expect(activityResult.photos()[0].state).to.eql({ id: "image1.jpg" });
    expect(activityResult.photos()[1].state).to.eql({ id: "image2.jpg" });
  });

  it("should have a field of defined tags for an activityResult", () => {
    expect(new ActivityResult({ tags: ["1", "2"] }).tags()).to.be.eql(["1", "2"]);
  });

  it("can have photos added", () => {
    const activityResult = new ActivityResult({});

    activityResult.addPhoto({});
    expect(activityResult.photos()).to.have.length(1);
  });

  it("can have photos removed", () => {
    const activityResult = new ActivityResult({
      photos: [{ id: "image1.jpg" }, { id: "image2.jpg" }],
    });

    activityResult.deletePhotoById("image1.jpg");
    expect(activityResult.photos()).to.have.length(1);
  });

  describe("photo subdocument", () => {
    it("should be retrievable by id", () => {
      const activityResult = new ActivityResult({
        id: "whatever",
        photos: [{ id: "my_photo_id" }],
      });

      expect(activityResult.getPhotoById("my_photo_id")).to.exist();
    });

    it("should be updatable by id in title, tags and timestamp", () => {
      const activityResult = new ActivityResult({
        id: "whatever",
        photos: [{ id: "my_photo_id", title: "Title" }],
      });

      const date = DateTime.fromISO("2014-02-20T12:00:00Z");
      activityResult.updatePhotoById("my_photo_id", {
        title: "newTitle",
        tags: ["peter", "paul"],
        timestamp: date.toJSDate(),
      });
      expect(activityResult.getPhotoById("my_photo_id").title()).to.be("newTitle");
      expect(activityResult.getPhotoById("my_photo_id").tags()).to.eql(["peter", "paul"]);
      expect(activityResult.getPhotoById("my_photo_id").time()).to.eql(date);
    });

    it("should collect all distinct tags present", () => {
      const activityResult = new ActivityResult({
        id: "dontcare",
        photos: [{ tags: ["tagA", "tagC"] }, { tags: ["tagA", "tagD"] }],
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(["tagA", "tagC", "tagD"]);
    });

    it("should not collect undefined tags", () => {
      const activityResult = new ActivityResult({
        id: "dontcare",
        photos: [{ tags: ["tagA", "tagC"] }, { tags: null }],
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(["tagA", "tagC"]);
    });

    it("should not collect undefined tags", () => {
      const activityResult = new ActivityResult({
        id: "dontcare",
        photos: [{ tags: ["tagA", "tagC"] }, { tags: [undefined] }],
      });

      expect(activityResult.getDistinctPresentTags()).to.be.a.permutationOf(["tagA", "tagC"]);
    });

    it('displays a "legacy" uri', () => {
      const activityResult = new ActivityResult({
        id: "dontcare",
        photos: [{ id: "name.jpg", uri: "/gallery/legacyname.jpg" }],
      });

      expect(activityResult.getPhotoById("name.jpg").uri()).to.eql("/gallery/legacyname.jpg");
    });

    it("displays a uri based on the id", () => {
      const activityResult = new ActivityResult({
        id: "dontcare",
        photos: [{ id: "name.jpg" }],
      });

      expect(activityResult.getPhotoById("name.jpg").uri()).to.eql("/gallery/name.jpg");
    });
  });

  describe("preparation for display", () => {
    const timestamp1 = DateTime.fromISO("2014-02-20T12:00:00Z").toJSDate();
    const timestamp2 = DateTime.fromISO("2014-02-20T12:01:00Z").toJSDate();
    const timestamp3 = DateTime.fromISO("2014-02-21T12:01:00Z").toJSDate();

    it('creates a list of "day" objects', () => {
      const activityResult = new ActivityResult({
        id: "ar_id",
        photos: [
          { id: "image1.jpg", tags: ["tag1"], timestamp: timestamp1 },
          { id: "image2.jpg", tags: ["tag1"], timestamp: timestamp2 },
        ],
      });
      expect(activityResult.photosByDay()).to.have.length(1);
      expect(activityResult.photosByDay()[0].day.setLocale("de").toLocaleString(DateTime.DATE_SHORT)).to.be(
        "20.2.2014",
      );
      expect(activityResult.photosByDay()[0].photosByTag).to.have.ownKeys(["tag1"]);
      expect(activityResult.photosByDay()[0].photosByTag.tag1).to.have.length(2);
    });

    it("sorts the photos by time", () => {
      const activityResult = new ActivityResult({
        id: "ar_id",
        photos: [
          { id: "image2.jpg", tags: ["tag1"], timestamp: timestamp2 },
          { id: "image1.jpg", tags: ["tag1"], timestamp: timestamp1 },
        ],
      });
      const photosOfTag1 = activityResult.photosByDay()[0].photosByTag.tag1;
      expect(photosOfTag1[0].state).to.have.ownProperty("id", "image1.jpg");
      expect(photosOfTag1[1].state).to.have.ownProperty("id", "image2.jpg");
    });

    it("sorts the days by time descending", () => {
      const activityResult = new ActivityResult({
        id: "ar_id",
        photos: [
          { id: "image1.jpg", tags: ["tag1"], timestamp: timestamp1 },
          { id: "image2.jpg", tags: ["tag1"], timestamp: timestamp3 },
        ],
      });
      expect(activityResult.photosByDay()).to.have.length(2);
      expect(activityResult.photosByDay()[0].day.setLocale("de").toLocaleString(DateTime.DATE_SHORT)).to.be(
        "21.2.2014",
      );
      expect(activityResult.photosByDay()[1].day.setLocale("de").toLocaleString(DateTime.DATE_SHORT)).to.be(
        "20.2.2014",
      );
    });
  });
});
