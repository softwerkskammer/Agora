const crypto = require("crypto");
const request = require("request").defaults({ encoding: null });

function md5(emailAddress) {
  return emailAddress ? crypto.createHash("md5").update(emailAddress).digest("hex") : "";
}

async function imageDataFromGravatar(url) {
  return new Promise((resolve) => {
    request.get(url, (error, response, body) => {
      if (error) {
        return resolve(null);
      }
      const image = `data:${response.headers["content-type"]};base64,${Buffer.from(body).toString("base64")}`;
      const data = { image, hasNoImage: body.length < 150 };
      resolve(data);
    });
  });
}

module.exports = {
  avatarUrl: function avatarUrl(emailAddress, size, optionalTunneledGravatarUrl) {
    return `${(optionalTunneledGravatarUrl || "https://www.gravatar.com/avatar/") + md5(emailAddress)}?d=${
      size === 16 ? "blank" : "mm"
    }&s=${size}`;
  },

  getImage: async function getImage(member, optionalTunneledGravatarUrl) {
    const url = this.avatarUrl(member.email(), 16, optionalTunneledGravatarUrl);
    try {
      const data = await imageDataFromGravatar(url);
      member.setAvatarData(data);
      return data;
    } catch (e) {
      console.log(e);
    }
  },
};
