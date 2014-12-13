'use strict';

var conf = require('nconf');
var logger = require('winston').loggers.get('application');
var magick = require('imagemagick');
var uuid = require('node-uuid');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var async = require('async');
var _ = require('lodash');
var misc = conf.get('beans').get('misc');

var widths = {thumb: 400, preview: 1080};

function autoOrient(sourceImagePath, targetPath, callback) {
  magick.convert([sourceImagePath, '-auto-orient', targetPath], function (err) {
    callback(err, targetPath);
  });
}

function convert(sourceImagePath, targetPath, params, callback) {
  var angle = params.angle || '0';
  var scale = params.scale || '1';
  var geometry = params.geometry || '100x100+0+0';
  magick.convert([sourceImagePath, '-rotate', angle, '-resize', parseFloat(scale * 100) + '%', '-crop', geometry, targetPath], function (err) {
    callback(err, targetPath);
  });
}

function scaledImageId(id, width) {
  var ext = path.extname(id);
  return path.basename(id, ext) + '_' + width + ext;
}

function fullPath(name) {
  return path.join(conf.get('imageDirectory') || conf.get('TMPDIR') || '/tmp/', name);
}

function scaleImage(id, width, callback) {
  var scaledImagePath = fullPath(width ? scaledImageId(id, width) : id);
  fs.exists(scaledImagePath, function (exists) {
    if (exists || !width) { return callback(null, scaledImagePath); }
    magick.convert([fullPath(id), '-quality', '75', '-scale', width, scaledImagePath], function (err) {
      callback(err, scaledImagePath);
    });
  });
}

function representsImage(file) {
  return misc.representsImage(file);
}

function deleteAllImagesMatching(pattern, callback) {
  glob(fullPath(pattern), function (err, files) {
    async.each(_.filter(files, representsImage), fs.unlink, callback);
  });
}

module.exports = {
  deleteImage: function (id, callback) {
    deleteAllImagesMatching(path.basename(id, path.extname(id)) + '*', callback);
  },

  storeAvatar: function (tmpImageFilePath, nickname, params, callback) {
    var id = nickname + path.extname(tmpImageFilePath);
    convert(tmpImageFilePath, fullPath(id), params, callback);
  },

  scaleAndReturnFullImagePath: function (nickname, width, callback) {
    glob(fullPath(nickname + '*'), function (err, files) {
      if (err) { return callback(err); }
      var imageFile = _.find(files, representsImage);
      scaleImage(path.basename(imageFile), width, callback);
    });
  },

  deleteAvatar: function (nickname, callback) {
    deleteAllImagesMatching(nickname + '*', callback);
  },

  storeImage: function (tmpImageFilePath, callback) {
    var id = uuid.v4() + path.extname(tmpImageFilePath);
    autoOrient(tmpImageFilePath, fullPath(id), function (err) { callback(err, id); });
  },

  getMetadataForImage: function getMetadataForImage(id, callback) {
    magick.readMetadata(fullPath(id), callback);
  },

  retrieveScaledImage: function retrieveScaledImage(id, thumbOrPreview, callback) {
    scaleImage(id, widths[thumbOrPreview], callback);
  }

};
