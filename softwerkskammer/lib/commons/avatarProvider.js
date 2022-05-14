const crypto = require("crypto");
const util = require("util");
const request = require("request").defaults({ encoding: null });

function md5(emailAddress) {
  return emailAddress ? crypto.createHash("md5").update(emailAddress).digest("hex") : "";
}

function imageDataFromGravatar(url, callback) {
  request.get(url, (error, response, body) => {
    if (error) {
      return callback();
    }
    const image = "data:" + response.headers["content-type"] + ";base64," + Buffer.from(body).toString("base64");
    const data = { image, hasNoImage: body.length < 150 };
    callback(null, data);
  });
}

module.exports = {
  avatarUrl: function avatarUrl(emailAddress, size, optionalTunneledGravatarUrl) {
    return (
      (optionalTunneledGravatarUrl || "https://www.gravatar.com/avatar/") +
      md5(emailAddress) +
      "?d=" +
      (size === 16 ? "blank" : "mm") +
      "&s=" +
      size
    );
  },

  getImage: async function getImage(member, optionalTunneledGravatarUrl) {
    const url = this.avatarUrl(member.email(), 16, optionalTunneledGravatarUrl);
    const imageDataFromGravatarPromise = util.promisify(imageDataFromGravatar);
    try {
      const data = await imageDataFromGravatarPromise(url);
      member.setAvatarData(data);
      return data;
    } catch (e) {
      console.log(e);
    }
  },
};
