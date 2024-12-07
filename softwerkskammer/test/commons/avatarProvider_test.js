"use strict";

const expect = require("must-dist");

const Member = require("../../lib/members/member");
const avatarProvider = require("../../lib/commons/avatarProvider");

describe("AvatarProvider", () => {
  it('loads the gravatar of "leider" from gravatar', async () => {
    const member = new Member({ email: "derleider@web.de" });
    await avatarProvider.getImage(member);
    expect(member.inlineAvatar()).to.match("data:image/jpeg;base64,/9j/4"); // the real picture (volatile)
    expect(member.hasImage()).to.be(true);
  });

  it("defaults to no image if address has no gravatar", async () => {
    const member = new Member({ email: "derleider@web.dede" });
    await avatarProvider.getImage(member);
    expect(member.inlineAvatar()).to.match("data:image/png;base64,iVBO"); // no image
    expect(member.hasImage()).to.be(false);
  });

  it('defaults to "null" image if gravatar has errors', async () => {
    const member = new Member({ email: "derleider@web.de" });
    await avatarProvider.getImage(member, "http://nonexisting.site/");
    expect(member.inlineAvatar()).to.be("");
    expect(member.hasImage()).to.be(false);
  });
});
