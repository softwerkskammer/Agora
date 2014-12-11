'use strict';

var conf = require('nconf');
var logger = require('winston').loggers.get('application');
var magick = require('imagemagick');
var uuid = require('node-uuid');
var path = require('path');
var fs = require('fs');
var glob = require('glob');
var async = require('async');

var widths = {thumb: 400, preview: 1080};

function autoOrient(sourceImagePath, targetPath, callback) {
  magick.convert([sourceImagePath, '-auto-orient', targetPath], function (err) {
    callback(err, targetPath);
  });
}

function convert(sourceImagePath, targetPath, params, callback) {
  console.log(targetPath);
  magick.convert([sourceImagePath, '-rotate', params.angle, '-resize', parseInt(params.scale * 100, 10) + '%', '-crop', params.geometry, targetPath], function (err) {
    callback(err);
  });
}

function scaledImageId(id, width) {
  var ext = path.extname(id);
  return path.basename(id, ext) + '_' + width + ext;
}

function fullPath(name) {
  return path.join(conf.get('imageDirectory') || conf.get('TMPDIR') || '/tmp/', name);
}

module.exports = {
  deleteImage: function deleteImage(id, callback) {
    var pattern = path.basename(id, path.extname(id)) + '*';
    glob(fullPath(pattern), function (err, files) {
      async.each(files, fs.unlink, callback);
    });
  },

  storeAvatar: function storeAvatar(tmpImageFilePath, nickname, params, callback) {
    var id = nickname + path.extname(tmpImageFilePath);
    console.log(params);
    convert(tmpImageFilePath, fullPath(id), params, callback);
  },

  storeImage: function storeImage(tmpImageFilePath, callback) {
    var id = uuid.v4() + path.extname(tmpImageFilePath);
    autoOrient(tmpImageFilePath, fullPath(id), function (err) { callback(err, id); });
  },

  getMetadataForImage: function getMetadataForImage(id, callback) {
    magick.readMetadata(fullPath(id), callback);
  },

  retrieveScaledImage: function retrieveScaledImage(id, thumbOrPreview, callback) {
    var width = widths[thumbOrPreview];
    var scaledImagePath = fullPath(width ? scaledImageId(id, width) : id);

    fs.exists(scaledImagePath, function (exists) {
      var sourceImagePath = fullPath(id);
      if (exists || !width) {
        return callback(null, scaledImagePath);
      }
      magick.convert([sourceImagePath, '-quality', '75', '-scale', width, scaledImagePath], function (err) {
        callback(err, scaledImagePath);
      });
    });
  }

};
