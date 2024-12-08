"use strict";

require("../../testutil/configureForTest");

const request = require("supertest");
const sinon = require("sinon").createSandbox();

const galleryService = require("../../lib/gallery/galleryService");

const app = require("../../testutil/testHelper")("gallery").createApp();

const OK = 200;

describe("/gallery", () => {
  /* eslint no-path-concat: 0 */
  const storedImageId = "image.jpg";
  const imagePath = __dirname + "/fixtures/" + storedImageId;

  afterEach(() => {
    sinon.restore();
  });

  it("GET /{imageId} responds with the image", async () => {
    sinon.stub(galleryService, "retrieveScaledImage").callsFake((imageId) => {
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
