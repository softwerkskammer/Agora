const conf = require("simple-configure");
const sharp = require("sharp");
const exifr = require("exifr");
const uuid = require("uuid");
const path = require("path");
const fs = require("fs");
const fsProm = require("fs/promises");
const glob = require("glob");
const async = require("async");
const misc = conf.get("beans").get("misc");

const widths = { mini: 16, thumb: 400 };

function autoOrient(sourceImagePath, targetPath, callback) {
  sharp(sourceImagePath)
    .rotate()
    .withMetadata()
    .toFile(targetPath, (err) => callback(err, targetPath));
}

async function autoOrientAsync(sourceImagePath, targetPath) {
  await sharp(sourceImagePath).rotate().withMetadata().toFile(targetPath);
  return targetPath;
}

function convert(sourceImagePath, targetPath, params, callback) {
  const angle = params.angle || 0;
  const scale = params.scale || 1;
  const geometry = params.geometry || { left: 0, top: 0, width: 100, height: 100 };
  const image = sharp(sourceImagePath);
  image.metadata((err, metadata) => {
    const targetWidth = Math.round(scale * (angle === 90 || angle === 270 ? metadata.height : metadata.width));
    image
      .resize({ width: targetWidth })
      .rotate(angle)
      .extract(geometry)
      .toFile(targetPath, (err1) => callback(err1, targetPath));
  });
}

async function convertAsync(sourceImagePath, targetPath, params) {
  const angle = params.angle || 0;
  const scale = params.scale || 1;
  const geometry = params.geometry || { left: 0, top: 0, width: 100, height: 100 };
  const image = sharp(sourceImagePath);
  const metadata = await image.metadata();
  const targetWidth = Math.round(scale * (angle === 90 || angle === 270 ? metadata.height : metadata.width));
  return image.resize({ width: targetWidth }).rotate(angle).extract(geometry).toFile(targetPath);
}

function scaledImageId(id, width) {
  const ext = path.extname(id);
  return path.basename(id, ext) + "_" + width + ext;
}

function fullPathFor(name) {
  return path.join(conf.get("imageDirectory") || conf.get("TMPDIR") || "/tmp/", name);
}

function deleteAllImagesMatching(pattern, callback) {
  glob(fullPathFor(pattern), (err, files) => {
    if (err) {
      return callback(err);
    }
    async.each(files.filter(misc.representsImage), fs.unlink, callback);
  });
}

async function deleteAllImagesMatchingAsync(pattern) {
  const files = glob.sync(fullPathFor(pattern));
  return Promise.all(files.filter(misc.representsImage).map(fsProm.unlink));
}

module.exports = {
  deleteImageOld: function deleteImage(id, callback) {
    deleteAllImagesMatching(path.basename(id, path.extname(id)) + "*", callback);
  },

  deleteImage: async function deleteImage(id) {
    return deleteAllImagesMatchingAsync(path.basename(id, path.extname(id)) + "*");
  },

  storeAvatarOld: function (tmpImageFilePath, params, callback) {
    const id = uuid.v4() + path.extname(tmpImageFilePath);
    convert(tmpImageFilePath, fullPathFor(id), params, (err) => callback(err, id));
  },

  storeAvatar: async function storeAvatar(tmpImageFilePath, params) {
    const id = uuid.v4() + path.extname(tmpImageFilePath);
    await convertAsync(tmpImageFilePath, fullPathFor(id), params);
    return id;
  },

  deleteAvatarOld: function deleteAvatar(nickname, callback) {
    deleteAllImagesMatching(nickname + "*", callback);
  },

  deleteAvatar: async function deleteAvatar(nickname) {
    deleteAllImagesMatchingAsync(nickname + "*");
  },

  storeImageOld: function storeImage(tmpImageFilePath, callback) {
    const id = uuid.v4() + path.extname(tmpImageFilePath);
    autoOrient(tmpImageFilePath, fullPathFor(id), (err) => callback(err, id));
  },

  storeImage: async function storeImage(tmpImageFilePath) {
    const id = uuid.v4() + path.extname(tmpImageFilePath);
    await autoOrientAsync(tmpImageFilePath, fullPathFor(id));
    return id;
  },

  getMetadataForImageOld: function getMetadataForImage(id, callback) {
    async function callExifr(imagepath, cb) {
      try {
        const exif = await exifr.parse(imagepath);
        cb(null, { exif });
      } catch (e) {
        cb(e);
      }
    }

    callExifr(fullPathFor(id), callback);
  },

  getMetadataForImage: async function getMetadataForImage(id) {
    const exif = await exifr.parse(fullPathFor(id));
    return { exif };
  },

  retrieveScaledImage: function retrieveScaledImage(id, miniOrThumb, callback) {
    const image = fullPathFor(id);
    let width = widths[miniOrThumb];

    fs.exists(image, (exists) => {
      if (!exists) {
        return callback(new Error("Image " + image + " does not exist"));
      }
      if (!width) {
        return callback(null, fullPathFor(id));
      }
      const scaledImage = fullPathFor(scaledImageId(id, width));
      fs.exists(scaledImage, (existsScaledImage) => {
        if (existsScaledImage) {
          return callback(null, scaledImage);
        }
        sharp(image)
          .resize({ width })
          .toFile(scaledImage, (err) => callback(err, scaledImage));
      });
    });
  },

  retrieveScaledImageAsync: async function retrieveScaledImageAsync(id, miniOrThumb) {
    const image = fullPathFor(id);
    const width = widths[miniOrThumb];

    // eslint-disable-next-line no-sync
    const exists = fs.existsSync(image);
    if (!exists) {
      throw new Error("Image " + image + " does not exist");
    }
    if (!width) {
      return fullPathFor(id);
    }
    const scaledImage = fullPathFor(scaledImageId(id, width));
    // eslint-disable-next-line no-sync
    const existsScaledImage = fs.existsSync(scaledImage);
    if (existsScaledImage) {
      return scaledImage;
    }
    await sharp(image).resize({ width }).toFile(scaledImage);
    return scaledImage;
  },
};
