'use strict';

var crypto = require('crypto');
var request = require('request').defaults({encoding: null});

function md5(emailAddress) {
  return emailAddress ? crypto.createHash('md5').update(emailAddress).digest('hex') : '';
}

function imageDataFromGravatar(url, callback) {
  request.get(url, function (error, response, body) {
    if (error) {
      return callback();
    }
    var image = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64');
    var data = {image: image, hasNoImage: body.length < 100};
    callback(data);
  });
}

module.exports = {
  avatarUrl: function (emailAddress, size, optionalTunneledGravatarUrl) {
    return (optionalTunneledGravatarUrl || 'https://www.gravatar.com/avatar/') + md5(emailAddress) + '?d=' + (size === 16 ? 'blank' : 'mm') + '&s=' + size;
  },

  getImage: function (member, callback, optionalTunneledGravatarUrl) {
    var url = this.avatarUrl(member.email(), 16, optionalTunneledGravatarUrl);
    imageDataFromGravatar(url, function (data) {
      member.setAvatarData(data);
      callback(data);
    });
  }
};

