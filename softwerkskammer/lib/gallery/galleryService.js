const conf = require('simple-configure');
const sharp = require('sharp');
const exifr = require('exifr');
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');
const glob = require('glob');
const async = require('async');
const misc = conf.get('beans').get('misc');

const widths = {mini: 16, thumb: 400};

function autoOrient(sourceImagePath, targetPath, callback) {
  sharp(sourceImagePath)
    .rotate()
    .withMetadata()
    .toFile(targetPath, err => callback(err, targetPath));
}

function convert(sourceImagePath, targetPath, params, callback) {
  const angle = params.angle || 0;
  const scale = params.scale || 1;
  const geometry = params.geometry || {left: 0, top: 0, width: 100, height: 100};
  const image = sharp(sourceImagePath);
  image
    .metadata((err, metadata) => {
      const targetWidth = Math.round(scale * (angle === 90 || angle === 270 ? metadata.height : metadata.width));
      image
        .resize({width: targetWidth})
        .rotate(angle)
        .extract(geometry)
        .toFile(targetPath, err1 => callback(err1, targetPath));
    });
}

function scaledImageId(id, width) {
  const ext = path.extname(id);
  return path.basename(id, ext) + '_' + width + ext;
}

function fullPathFor(name) {
  return path.join(conf.get('imageDirectory') || conf.get('TMPDIR') || '/tmp/', name);
}

function deleteAllImagesMatching(pattern, callback) {
  glob(fullPathFor(pattern), (err, files) => {
    if (err) { return callback(err); }
    async.each(files.filter(misc.representsImage), fs.unlink, callback);
  });
}

module.exports = {
  deleteImage: function deleteImage(id, callback) {
    deleteAllImagesMatching(path.basename(id, path.extname(id)) + '*', callback);
  },

  storeAvatar: function storeAvatar(tmpImageFilePath, params, callback) {
    const id = uuid.v4() + path.extname(tmpImageFilePath);
    convert(tmpImageFilePath, fullPathFor(id), params, err => callback(err, id));
  },

  deleteAvatar: function deleteAvatar(nickname, callback) {
    deleteAllImagesMatching(nickname + '*', callback);
  },

  storeImage: function storeImage(tmpImageFilePath, callback) {
    const id = uuid.v4() + path.extname(tmpImageFilePath);
    autoOrient(tmpImageFilePath, fullPathFor(id), err => callback(err, id));
  },

  getMetadataForImage: function getMetadataForImage(id, callback) {
    async function callExifr(imagepath, cb) {
      try {
        const exif = await exifr.parse(imagepath);
        cb(null, {exif});
      } catch (e) {cb(e);}
    }

    callExifr(fullPathFor(id), callback);
  },

  retrieveScaledImage: function retrieveScaledImage(id, miniOrThumb, callback) {
    const image = fullPathFor(id);
    let width = widths[miniOrThumb];

    fs.exists(image, exists => {
      if (!exists) { return callback(new Error('Image ' + image + ' does not exist')); }
      if (!width) { return callback(null, fullPathFor(id)); }
      const scaledImage = fullPathFor(scaledImageId(id, width));
      fs.exists(scaledImage, existsScaledImage => {
        if (existsScaledImage) { return callback(null, scaledImage); }
        sharp(image)
          .resize({width})
          .toFile(scaledImage, err => callback(err, scaledImage));
      });
    });
  }

};
