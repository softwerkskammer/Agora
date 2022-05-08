"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const Member = beans.get("member");
const avatarProvider = beans.get("avatarProvider");

describe("AvatarProvider", () => {
  it('loads the gravatar of "leider" from gravatar', (done) => {
    const member = new Member({ email: "derleider@web.de" });
    avatarProvider.getImage(member, () => {
      expect(member.inlineAvatar()).to.match("data:image/jpeg;base64,/9j/4"); // the real picture (volatile)
      expect(member.hasImage()).to.be(true);
      done();
    });
  });

  it("defaults to no image if address has no gravatar", (done) => {
    const member = new Member({ email: "derleider@web.dede" });
    avatarProvider.getImage(member, () => {
      expect(member.inlineAvatar()).to.match("data:image/png;base64,iVBO"); // no image
      expect(member.hasImage()).to.be(false);
      done();
    });
  });

  it('defaults to "null" image if gravatar has errors', (done) => {
    const member = new Member({ email: "derleider@web.de" });
    avatarProvider.getImage(
      member,
      () => {
        expect(member.inlineAvatar()).to.be("");
        expect(member.hasImage()).to.be(false);
        done();
      },
      "http://nonexisting.site/"
    );
  });
});
