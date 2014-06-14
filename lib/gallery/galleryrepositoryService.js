'use strict';

var conf = require('nconf');
var uuid = require('node-uuid');
var fs = require('fs');
var path = require('path');

module.exports = {
  directory: function directory() {
    return conf.get('imageDirectory');
  },

  storeImage: function storeImage(tmpImageFilePath, callback) {
    var id = uuid.v4() + path.extname(tmpImageFilePath);
    var persistentImageFilePath = this.directory() + '/' + id;

    fs.rename(tmpImageFilePath, persistentImageFilePath, function (err) {
      callback(err, id);
    });
  },

  retrieveImage: function retrieveImage(id, callback) {
    var persistentImageFilePath = this.directory() + '/' + id;

    fs.exists(persistentImageFilePath, function (exists) {
      if (!exists) {
        callback(new Error('Requested image ' + id + ' does not exist at ' + persistentImageFilePath));
      } else {
        callback(null, persistentImageFilePath);
      }
    });
  }
};
