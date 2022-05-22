"use strict";

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();

const beans = require("../../testutil/configureForTest").get("beans");

const galleryService = beans.get("galleryService");
const persistence = beans.get("activityresultsPersistence");
const service = beans.get("activityresultsService");
const ActivityResult = beans.get("activityresult");

describe("ActivityResult service", () => {
  let activityResult;
  let getById;

  beforeEach(() => {
    activityResult = { id: "Hackergarten2", photos: [{ id: "image1.jpg" }] };
    getById = sinon.stub(persistence, "getMongoById").returns(activityResult);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("the getActivityResultByName method", () => {
    it("should return the activityResult for an id", async () => {
      const returnedActivityResult = await service.getActivityResultByName(activityResult.id);
      expect(returnedActivityResult.id()).to.equal(activityResult.id);
    });

    it("should return an error if activity does not exist", async () => {
      getById.restore();
      sinon.stub(persistence, "getMongoById").throws(new Error("not found"));

      try {
        await service.getActivityResultByName("non-existing-id");
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it("return an activitymodel instance", async () => {
      const model = await service.getActivityResultByName(activityResult.id);
      expect(model).to.be.an.instanceOf(ActivityResult);
    });
  });

  it("addPhotoToActivityResult should add an image to an activityresult", async () => {
    const saveStub = sinon.stub(persistence, "saveMongo");

    sinon.stub(galleryService, "storeImage").callsFake((path) => {
      return path;
    });
    sinon.stub(galleryService, "getMetadataForImage");

    const imageUri = await service.addPhotoToActivityResult("Hackergarten2", { path: "my_uri" }, "memberId");
    expect(saveStub.called).to.be(true);
    const objectToSave = saveStub.args[0][0];
    expect(objectToSave.photos).to.have.length(2);
    expect(imageUri).to.be("my_uri");
  });

  it("updatePhotoOfActivityResult should change an image in an activityresult", async () => {
    const saveStub = sinon.stub(persistence, "saveMongo");

    await service.updatePhotoOfActivityResult(
      "Hackergarten2",
      "image1.jpg",
      { title: "Photo 1" },
      { canEditPhoto: () => true }
    );
    expect(saveStub.called).to.be(true);
    const objectToSave = saveStub.args[0][0];
    expect(objectToSave.photos).to.have.length(1);
    expect(objectToSave.photos[0]).to.have.ownProperty("title", "Photo 1");
  });
});
