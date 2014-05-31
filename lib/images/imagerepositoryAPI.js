var conf = require('nconf');

module.exports = {
  directory: conf.get('imageDirectory'),
  storeImage: function storeImage (stream, callback) {
    callback();
  }
};