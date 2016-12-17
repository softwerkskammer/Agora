const crypto = require('crypto');
const request = require('request').defaults({encoding: null});

function md5(emailAddress) {
  return emailAddress ? crypto.createHash('md5').update(emailAddress).digest('hex') : '';
}

function imageDataFromGravatar(url, callback) {
  request.get(url, (error, response, body) => {
    if (error) {
      return callback();
    }
    const image = 'data:' + response.headers['content-type'] + ';base64,' + new Buffer(body).toString('base64');
    const data = {image, hasNoImage: body.length < 100};
    callback(data);
  });
}

module.exports = {
  avatarUrl: function avatarUrl(emailAddress, size, optionalTunneledGravatarUrl) {
    return (optionalTunneledGravatarUrl || 'https://www.gravatar.com/avatar/') + md5(emailAddress) + '?d=' + (size === 16 ? 'blank' : 'mm') + '&s=' + size;
  },

  getImage: function getImage(member, callback, optionalTunneledGravatarUrl) {
    const url = this.avatarUrl(member.email(), 16, optionalTunneledGravatarUrl);
    imageDataFromGravatar(url, data => {
      member.setAvatarData(data);
      callback(data);
    });
  }
};

