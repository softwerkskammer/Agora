'use strict';

var request = require('request').defaults({ encoding: null });
var conf = require('nconf');
var NodeCache = require('node-cache');
var fieldHelpers = conf.get('beans').get('fieldHelpers');

var imageCache = new NodeCache({stdTTL: 60 * 60}); // one hour

function avatarUrl(member) {
  return fieldHelpers.avatarUrl(member.email(), 16);
}

module.exports = {

  imageDataFromCache: function (member) {
    var url = avatarUrl(member);
    return imageCache.get(url)[url];
  },

  imageDataFromGravatar: function (member, callback) {
    var url = avatarUrl(member);
    request.get(url, function (error, response, body) {
      if (error) {
        return callback({image: null, hasNoImage: true});
      }
      var image = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64');
      var data = {image: image, hasNoImage: body.length < 100};
      imageCache.set(url, data);
      callback(data);
    });
  }
};

