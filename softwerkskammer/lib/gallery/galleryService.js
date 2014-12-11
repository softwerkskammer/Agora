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

var widths = {thumb: 400, preview: 1080};

function autoOrient(sourceImagePath, targetPath, callback) {
  magick.convert([sourceImagePath, '-auto-orient', targetPath], function (err) {
    callback(err, targetPath);
  });
}

function convert(sourceImagePath, targetPath, params, callback) {
  magick.convert([sourceImagePath, '-rotate', params.angle, '-resize', parseFloat(params.scale * 100) + '%', '-crop', params.geometry, targetPath], function (err) {
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
  return file.match(/jpg$|jpeg$|png$/);
}

module.exports = {
  deleteImage: function (id, callback) {
    var pattern = path.basename(id, path.extname(id)) + '*';
    glob(fullPath(pattern), function (err, files) {
      async.each(files, fs.unlink, callback);
    });
  },

  storeAvatar: function (tmpImageFilePath, nickname, params, callback) {
    var id = nickname + path.extname(tmpImageFilePath);
    convert(tmpImageFilePath, fullPath(id), params, callback);
  },

  loadAvatar: function (nickname, width, callback) {
    glob(fullPath(nickname + '*'), function (err, files) {
      if (err) { return callback(err); }
      var imageFile = _.find(files, representsImage);
      scaleImage(path.basename(imageFile), width, callback);
    });
  },

  deleteAvatar: function (nickname, callback) {
    glob(fullPath(nickname + '*'), function (err, files) {
      async.each(_.filter(files, representsImage), fs.unlink, callback);
    });
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
