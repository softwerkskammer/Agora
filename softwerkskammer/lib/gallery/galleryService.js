'use strict';

var conf = require('nconf');
var logger = require('winston').loggers.get('application');
var magick = require('imagemagick');
var uuid = require('node-uuid');
var path = require('path');
var fs = require('fs');

function autoOrient(sourceImagePath, targetPath, callback) {
  magick.convert([sourceImagePath, '-auto-orient', targetPath], function (err) {
    callback(err, targetPath);
  });
}

function scale(sourceImagePath, targetPath, width, height, callback) {
  magick.convert([sourceImagePath, '-quality', '75', '-scale', width + (height ? '!x' + height + '!' : ''), targetPath], function (err) {
    callback(err, targetPath);
  });
}

function scaledImageId(id, width, height) {
  var ext = path.extname(id);
  return path.basename(id, ext) + '_' + width + 'x' + height + ext;
}

function fullPath(name) {
  return path.join(conf.get('imageDirectory') || conf.get('TMPDIR'), name);
}

module.exports = {
  storeImage: function storeImage(tmpImageFilePath, callback) {
    var id = uuid.v4() + path.extname(tmpImageFilePath);
    autoOrient(tmpImageFilePath, fullPath(id), function (err) { callback(err, id); });
  },

  getMetadataForImage: function getMetadataForImage(id, callback) {
    magick.readMetadata(fullPath(id), callback);
  },

  retrieveScaledImage: function retrieveScaledImage(id, width, height, callback) {
    var scaledImagePath = fullPath(width ? scaledImageId(id, width, height) : id);

    fs.exists(scaledImagePath, function (exists) {
      var sourceImagePath = fullPath(id);
      if (exists || !width) {
        return callback(null, scaledImagePath);
      }
      scale(sourceImagePath, scaledImagePath, width, height, callback);
    });
  }

};
