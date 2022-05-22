const conf = require("simple-configure");
const sharp = require("sharp");
const exifr = require("exifr");
const uuid = require("uuid");
const path = require("path");
const fs = require("fs");
const fsProm = require("fs/promises");
const glob = require("glob");
const misc = conf.get("beans").get("misc");

const widths = { mini: 16, thumb: 400 };

async function autoOrientAsync(sourceImagePath, targetPath) {
  await sharp(sourceImagePath).rotate().withMetadata().toFile(targetPath);
  return targetPath;
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

async function deleteAllImagesMatchingAsync(pattern) {
  const files = glob.sync(fullPathFor(pattern));
  return Promise.all(files.filter(misc.representsImage).map(fsProm.unlink));
}

module.exports = {
  deleteImage: async function deleteImage(id) {
    return deleteAllImagesMatchingAsync(path.basename(id, path.extname(id)) + "*");
  },

  storeAvatar: async function storeAvatar(tmpImageFilePath, params) {
    const id = uuid.v4() + path.extname(tmpImageFilePath);
    await convertAsync(tmpImageFilePath, fullPathFor(id), params);
    return id;
  },

  deleteAvatar: async function deleteAvatar(nickname) {
    deleteAllImagesMatchingAsync(nickname + "*");
  },

  storeImage: async function storeImage(tmpImageFilePath) {
    const id = uuid.v4() + path.extname(tmpImageFilePath);
    await autoOrientAsync(tmpImageFilePath, fullPathFor(id));
    return id;
  },

  getMetadataForImage: async function getMetadataForImage(id) {
    const exif = await exifr.parse(fullPathFor(id));
    return { exif };
  },

  retrieveScaledImage: async function retrieveScaledImage(id, miniOrThumb) {
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
