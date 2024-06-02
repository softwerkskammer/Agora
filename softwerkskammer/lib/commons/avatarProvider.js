const crypto = require("crypto");
const superagent = require("superagent");

function md5(emailAddress) {
  return emailAddress ? crypto.createHash("md5").update(emailAddress).digest("hex") : "";
}

async function imageDataFromGravatar(url) {
  try {
    const { headers, body } = await superagent.get(url);
    const image = `data:${headers["content-type"]};base64,${body.toString("base64")}`;
    return { image, hasNoImage: body.length < 150 };
  } catch (e) {
    return null;
  }
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
      // eslint-disable-next-line no-console
      console.log(e);
      throw e;
    }
  },
};
