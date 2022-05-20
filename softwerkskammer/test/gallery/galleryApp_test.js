"use strict";
const request = require("supertest");
const sinon = require("sinon").createSandbox();

const beans = require("../../testutil/configureForTest").get("beans");
const galleryService = beans.get("galleryService");

const app = require("../../testutil/testHelper")("galleryApp").createApp();

const OK = 200;

describe("/gallery", () => {
  /* eslint no-path-concat: 0 */
  const storedImageId = "image.jpg";
  const imagePath = __dirname + "/fixtures/" + storedImageId;

  afterEach(() => {
    sinon.restore();
  });

  it("GET /{imageId} responds with the image", async () => {
    sinon.stub(galleryService, "retrieveScaledImageAsync").callsFake((imageId) => {
      if (storedImageId === imageId) {
        return imagePath;
      }
      return null;
    });

    await request(app)
      .get("/" + storedImageId)
      .expect(OK)
      .expect("Content-Type", "image/jpeg");
  });
});
