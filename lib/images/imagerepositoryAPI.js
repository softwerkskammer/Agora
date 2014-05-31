var conf = require('nconf');

module.exports = {
  directory: conf.get('imageDirectory')
};