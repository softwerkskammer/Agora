const { DateTime } = require("luxon");

const beans = require("simple-configure").get("beans");
const persistence = beans.get("activityresultsPersistence");
const galleryService = beans.get("galleryService");
const ActivityResult = beans.get("activityresult");

async function load(activityResultName) {
  const data = await persistence.getMongoById(activityResultName);
  return data ? new ActivityResult(data) : undefined;
}

module.exports = {
  getActivityResultByName: load,

  addPhotoToActivityResult: async function addPhotoToActivityResult(activityResultName, image, memberId) {
    const imageUri = await galleryService.storeImage(image.path);
    const metadata = await galleryService.getMetadataForImage(imageUri);
    const activityResult = await load(activityResultName);
    let date = new Date();
    if (metadata && metadata.exif) {
      date = metadata.exif.DateTime || metadata.exif.DateTimeOriginal || metadata.exif.DateTimeDigitized || new Date();
    }
    const picturesDate = DateTime.fromJSDate(date);
    const now = DateTime.local();
    activityResult.addPhoto({
      id: imageUri,
      timestamp: (picturesDate < now ? picturesDate : now).toJSDate(),
      // eslint-disable-next-line camelcase
      uploaded_by: memberId,
    });
    await persistence.saveMongo(activityResult.state);
    return imageUri;
  },

  updatePhotoOfActivityResult: async function updatePhotoOfActivityResult(
    activityResultName,
    photoId,
    data,
    accessrights
  ) {
    const activityResult = await load(activityResultName);
    let photo = activityResult.getPhotoById(photoId);
    if (!photo) {
      return null;
    }
    if (accessrights.canEditPhoto(photo)) {
      activityResult.updatePhotoById(photoId, data);
      return persistence.saveMongo(activityResult.state);
    }
  },

  deletePhotoOfActivityResult: async function deletePhotoOfActivityResult(activityResultName, photoId) {
    const activityResult = await load(activityResultName);
    activityResult.deletePhotoById(photoId);
    await persistence.saveMongo(activityResult.state);
    return galleryService.deleteImage(photoId);
  },
};
