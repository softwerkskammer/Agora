'use strict';

var conf = require('nconf');
var logger = require('winston').loggers.get('gallery');
var magick = require('imagemagick');
var uuid = require('node-uuid');
var path = require('path');

function autoOrient(sourceImagePath, targetPath, callback) {
  logger.debug('Auto-orienting `' + sourceImagePath + '\' into `' + targetPath + '\'');
  magick.convert([sourceImagePath, '-auto-orient', targetPath], function (err, stdout) {
    if (err) {
      return callback(err, undefined);
    }
    logger.debug('stdout:', stdout);
    callback(undefined, targetPath);
  });
}

module.exports = {
  directory: function directory() {
    return conf.get('imageDirectory');
  },

  // @rradczewski Wird das hier noch benötigt, wenn wir auf Image Magick setzen?
  fs: function fs() {
    return require('fs');
  },

  storeImage: function storeImage(tmpImageFilePath, callback) {
    var id = uuid.v4() + path.extname(tmpImageFilePath);
    var persistentImageFilePath = this.directory() + '/' + id;

    autoOrient(tmpImageFilePath, persistentImageFilePath, function (err) {
      callback(err, id);
    });
  },

  retrieveImage: function retrieveImage(id, callback) {
    var persistentImageFilePath = this.directory() + '/' + id;

    this.fs().exists(persistentImageFilePath, function (exists) {
      if (!exists) {
        callback(new Error('Requested image ' + id + ' does not exist at ' + persistentImageFilePath));
      } else {
        callback(null, persistentImageFilePath);
      }
    });
  }
};
