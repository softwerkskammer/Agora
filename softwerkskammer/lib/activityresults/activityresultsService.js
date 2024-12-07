"use strict";
const { DateTime } = require("luxon");

const beans = require("simple-configure").get("beans");
const persistence = beans.get("activityresultsPersistence");
const galleryService = require("../gallery/galleryService");
const ActivityResult = require("./activityresult");

function load(activityResultName) {
  const data = persistence.getById(activityResultName);
  return data ? new ActivityResult(data) : undefined;
}

module.exports = {
  getActivityResultByName: load,

  addPhotoToActivityResult: async function addPhotoToActivityResult(activityResultName, image, memberId) {
    const imageUri = await galleryService.storeImage(image.path);
    const metadata = await galleryService.getMetadataForImage(imageUri);
    const activityResult = load(activityResultName);
    let date = new Date();
    if (metadata && metadata.exif) {
      date = metadata.exif.DateTime || metadata.exif.DateTimeOriginal || metadata.exif.DateTimeDigitized || new Date();
    }
    const picturesDate = DateTime.fromJSDate(date);
    const now = DateTime.local();
    activityResult.addPhoto({
      id: imageUri,
      timestamp: (picturesDate < now ? picturesDate : now).toISO(),
      // eslint-disable-next-line camelcase
      uploaded_by: memberId,
    });
    persistence.save(activityResult.state);
    return imageUri;
  },

  updatePhotoOfActivityResult: function updatePhotoOfActivityResult(activityResultName, photoId, data, accessrights) {
    const activityResult = load(activityResultName);
    let photo = activityResult.getPhotoById(photoId);
    if (!photo) {
      return null;
    }
    if (accessrights.canEditPhoto(photo)) {
      activityResult.updatePhotoById(photoId, data);
      return persistence.save(activityResult.state);
    }
  },

  deletePhotoOfActivityResult: function deletePhotoOfActivityResult(activityResultName, photoId) {
    const activityResult = load(activityResultName);
    activityResult.deletePhotoById(photoId);
    persistence.save(activityResult.state);
    return galleryService.deleteImage(photoId);
  },
};
