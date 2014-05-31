'use strict';

var conf = require('nconf');
var Readable = require('stream').Readable;
var uuid = require('node-uuid');
var fs = require('fs');

module.exports = {
  directory: function directory() {
    return conf.get('imageDirectory');
  },

  storeImage: function storeImage(stream, callback) {
    if (!(stream instanceof Readable)) {
      return callback(new Error('No stream supplied'));
    }
    var id = uuid.v4();
    var path = this.directory() + '/' + id;

    var fileWriteStream = fs.createWriteStream(path);
    stream.pipe(fileWriteStream);
    fileWriteStream.end();

    callback(null, id);
  }
};
