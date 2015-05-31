'use strict';

var crypto = require('crypto');
var request = require('request').defaults({encoding: null});
var NodeCache = require('node-cache');

var imageCache = new NodeCache({stdTTL: 60 * 60}); // one hour

module.exports = {
  avatarUrl: function (emailAddress, size) {
    function md5() {
      return emailAddress ? crypto.createHash('md5').update(emailAddress).digest('hex') : '';
    }

    return 'https://www.gravatar.com/avatar/' + md5() + '?d=' + (size === 16 ? 'blank' : 'mm') + '&s=' + size;
  },

  getImage: function (member, callback) {
    var imageData = this.imageDataFromCache(member);
    if (imageData) {
      member.setAvatarData(imageData);
      return callback();
    }
    this.imageDataFromGravatar(member, function (data) {
      member.setAvatarData(data);
      callback();
    });
  },

  imageDataFromCache: function (member) {
    var url = this.avatarUrl(member.email(), 16);
    return imageCache.get(url);
  }, // public for stubbing in test

  imageDataFromGravatar: function (member, callback) {
    var url = this.avatarUrl(member.email(), 16);
    request.get(url, function (error, response, body) {
      if (error) {
        return callback({image: null, hasNoImage: true});
      }
      var image = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64');
      var data = {image: image, hasNoImage: body.length < 100};
      imageCache.set(url, data);
      callback(data);
    });
  } // public for stubbing in test
};

