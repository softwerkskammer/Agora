"use strict";
/*eslint no-sync: 0 */

const conf = require("../../testutil/configureForTest");
const expect = require("must-dist");
const fs = require("fs");
const path = require("path");

const service = require("../../lib/gallery/galleryService");

const sourceImage = path.join(__dirname, "/fixtures/image.jpg");

function tmpPathFor(name) {
  return path.join(conf.get("imageDirectory") || conf.get("TMPDIR") || "/tmp/", name);
}

function exists(name) {
  return fs.existsSync(tmpPathFor(name));
}

describe("the gallery repository on real files", () => {
  describe("metadata for images", () => {
    it("provides exif data for a given image", async () => {
      const exifPath = path.join(__dirname, "/fixtures/exif_image.jpg");
      const imageId = await service.storeImage(exifPath);
      const metadata = await service.getMetadataForImage(imageId);
      expect(metadata.exif).to.have.property("DateTimeOriginal");
    });
  });

  describe("stores an image", () => {
    it("in the file system", async () => {
      const storedImageId = await service.storeImage(sourceImage);
      expect(exists(storedImageId)).to.be(true);
    });
  });

  describe("retrieval of images", () => {
    it("provides the original image when no width is provided", async () => {
      const imageId = await service.storeImage(sourceImage);
      const retrievedImagePath = await service.retrieveScaledImage(imageId, undefined);
      expect(fs.existsSync(retrievedImagePath)).to.be(true);
      expect(retrievedImagePath).to.be(tmpPathFor(imageId));
    });

    it("provides scaled image path when width is provided", async () => {
      const imageId = await service.storeImage(sourceImage);

      // first retrieve: scaled image does not exist yet
      const retrievedImagePath = await service.retrieveScaledImage(imageId, "thumb");
      expect(fs.existsSync(retrievedImagePath)).to.be(true);
      expect(retrievedImagePath).to.not.be(tmpPathFor(imageId));
      expect(retrievedImagePath).to.match(/_400\.jpg$/);

      // second retrieve: scaled image already exists
      const retrievedImagePath2 = await service.retrieveScaledImage(imageId, "thumb");
      expect(retrievedImagePath2).to.be(retrievedImagePath);
    });

    it("returns error for invalid imageId when width is not provided", async () => {
      try {
        await service.retrieveScaledImage("invalidId");
        expect(false).to.be(true);
      } catch (e) {
        expect(e).to.exist();
      }
    });

    it("returns error for invalid imageId when width is provided", async () => {
      try {
        await service.retrieveScaledImage("invalidId", "thumb");
        expect(false).to.be(true);
      } catch (e) {
        expect(e).to.exist();
      }
    });
  });

  describe("deletion of images", () => {
    it("deletes an image", async () => {
      const imageId = await service.storeImage(sourceImage);
      expect(exists(imageId)).to.be.true();
      await service.deleteImage(tmpPathFor(imageId));
      expect(exists(imageId)).to.be.false();
    });
  });

  describe("avatar images", () => {
    it("stores an avatar image", async () => {
      const name = await service.storeAvatar(sourceImage, {});
      await service.retrieveScaledImage(name, undefined);
    });

    it("stores a miniavatar image", async () => {
      const name = await service.storeAvatar(sourceImage, {});
      const lname = await service.retrieveScaledImage(name, "mini");
      expect(lname).to.match(/_16\.jpg/);
    });

    it("deletes an existing avatar image", async () => {
      const name = await service.storeAvatar(sourceImage, {});
      expect(exists(name)).to.be.true();
      await service.deleteImage(name);
      expect(exists(name)).to.be.false();
    });

    it('is happy with "deleting" a non-existing avatar image', async () => {
      const name = await service.storeAvatar(sourceImage, {});
      expect(exists(name)).to.be.true();
      await service.deleteImage("nonexisting" + name);
      expect(exists(name)).to.be.true();
    });
  });
});
