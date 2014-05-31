'use strict';

var conf = require('nconf');
var Readable = require('stream').Readable;


module.exports = {
  directory: function directory() {
    return conf.get('imageDirectory');
  },

  storeImage: function storeImage(stream, callback) {
    if (!(stream instanceof Readable)) {
      return callback(new Error('No stream supplied'));
    }

    callback();
  }
};
