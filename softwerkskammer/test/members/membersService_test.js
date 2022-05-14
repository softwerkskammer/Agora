"use strict";

const expect = require("must-dist");
const sinon = require("sinon").createSandbox();
const beans = require("../../testutil/configureForTest").get("beans");

const Member = beans.get("member");
const memberstore = beans.get("memberstore");
const membersService = beans.get("membersService");
const avatarProvider = beans.get("avatarProvider");

describe("MembersService", () => {
  const imagePath = __dirname + "/../gallery/fixtures/image.jpg";
  let member;

  beforeEach(() => {
    member = new Member();
    sinon.stub(memberstore, "getMember").callsFake((nickname) => {
      if (new RegExp(nickname, "i").test("hada")) {
        return member;
      }
      return null;
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("checking nicknames", () => {
    it("regards various nicknames as reserved words, ignoring the case", () => {
      expect(membersService.isReserved("edit")).to.be(true);
      expect(membersService.isReserved("eDit")).to.be(true);
      expect(membersService.isReserved("neW")).to.be(true);
      expect(membersService.isReserved("checknicKName")).to.be(true);
      expect(membersService.isReserved("submIt")).to.be(true);
      expect(membersService.isReserved("administration")).to.be(true);
      expect(membersService.isReserved(".")).to.be(true);
      expect(membersService.isReserved("..")).to.be(true);
    });

    it("accepts untrimmed versions of reserved words", async () => {
      const result = await membersService.isValidNickname(" checknicKName ");
      expect(result).to.be(true);
    });

    it("rejects nicknames that already exist, ignoring case", async () => {
      const result = await membersService.isValidNickname("haDa");
      expect(result).to.be(false);
    });

    it('rejects nicknames that contain an "/"', async () => {
      const result = await membersService.isValidNickname("ha/ha");
      expect(result).to.be(false);
    });

    it("accepts nicknames that do not exist", async () => {
      const result = await membersService.isValidNickname("haha");
      expect(result).to.be(true);
    });

    it("accepts nicknames that contain other nicknames", async () => {
      const result = await membersService.isValidNickname("Sc" + "hada" + "r");
      expect(result).to.be(true);
    });

    it("accepts untrimmed versions of nicknames that already exist", async () => {
      const result = await membersService.isValidNickname(" hada ");
      expect(result).to.be(true);
    });

    it('accepts nicknames containing ".." and "."', () => {
      expect(membersService.isReserved("a..")).to.be(false);
      expect(membersService.isReserved("a.")).to.be(false);
      expect(membersService.isReserved("..a")).to.be(false);
      expect(membersService.isReserved(".a")).to.be(false);
    });
  });

  describe('"toWordList"', () => {
    it("trims simple interest strings", () => {
      const members = [];
      members.push(new Member({ interests: "Heinz, Becker" }));
      const result = membersService.toWordList(members);
      expect(result[0]).to.include("Heinz");
      expect(result[1]).to.include("Becker");
    });

    it("sums tags inside one member", () => {
      const members = [];
      members.push(new Member({ interests: "Heinz, Heinz" }));
      const result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: "Heinz", weight: 2, html: { class: "interestify" } });
    });

    it("uses the most common writing", () => {
      const members = [];
      members.push(new Member({ interests: "heinz, Heinz, HeInZ, Heinz, Heinz, heinz" }));
      const result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: "Heinz", weight: 6, html: { class: "interestify" } });
    });

    it("sums tags of two members", () => {
      const members = [];
      members.push(new Member({ interests: " Heinz" }));
      members.push(new Member({ interests: "Heinz  " }));
      const result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: "Heinz", weight: 2, html: { class: "interestify" } });
    });

    it("handles empty interests tags", () => {
      const members = [];
      members.push(new Member({}));
      members.push(new Member({ interests: "Heinz  " }));
      const result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: "Heinz", weight: 1, html: { class: "interestify" } });
    });

    it("keeps \" and '", () => {
      const members = [];
      members.push(new Member({ interests: ' "H\'ei"nz"' }));
      const result = membersService.toWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: '"H\'ei"nz"', weight: 1, html: { class: "interestify" } });
    });

    it("keeps ( and )", () => {
      const members = [];
      members.push(new Member({ interests: "Patterns (nicht nur im Code, sondern vor allem beim Lernen)" }));
      const result = membersService.toWordList(members);
      expect(result).to.have.length(2);
      expect(result[0]).to.eql({ text: "Patterns (nicht nur im Code", weight: 1, html: { class: "interestify" } });
      expect(result[1]).to.eql({ text: "sondern vor allem beim Lernen)", weight: 1, html: { class: "interestify" } });
    });
  });

  describe('"toUngroupedWordList"', () => {
    it("trims simple interest strings and sorts them", () => {
      const members = [];
      members.push(new Member({ interests: "Heinz, Becker" }));
      const result = membersService.toUngroupedWordList(members);
      expect(result[0]).to.include("Becker");
      expect(result[1]).to.include("Heinz");
    });

    it("sums tags inside one member", () => {
      const members = [];
      members.push(new Member({ interests: "Heinz, Heinz" }));
      const result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: "Heinz", weight: 2, html: { class: "interestify" } });
    });

    it("returns one entry for each writing", () => {
      const members = [];
      members.push(new Member({ interests: "Heinz, heinz, HeInZ, Heinz, Heinz, heinz" }));
      const result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(3);
      expect(result[0]).to.eql({ text: "heinz", weight: 2, html: { class: "interestify" } });
      expect(result[1]).to.eql({ text: "Heinz", weight: 3, html: { class: "interestify" } });
      expect(result[2]).to.eql({ text: "HeInZ", weight: 1, html: { class: "interestify" } });
    });

    it("sums tags of two members", () => {
      const members = [];
      members.push(new Member({ interests: " Heinz" }));
      members.push(new Member({ interests: "Heinz  " }));
      const result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: "Heinz", weight: 2, html: { class: "interestify" } });
    });

    it("handles empty interests tags", () => {
      const members = [];
      members.push(new Member({}));
      members.push(new Member({ interests: "Heinz  " }));
      const result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: "Heinz", weight: 1, html: { class: "interestify" } });
    });

    it("keeps \" and '", () => {
      const members = [];
      members.push(new Member({ interests: ' "H\'ei"nz"' }));
      const result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(1);
      expect(result[0]).to.eql({ text: '"H\'ei"nz"', weight: 1, html: { class: "interestify" } });
    });

    it("keeps ( and )", () => {
      const members = [];
      members.push(new Member({ interests: "Patterns (nicht nur im Code, sondern vor allem beim Lernen)" }));
      const result = membersService.toUngroupedWordList(members);
      expect(result).to.have.length(2);
      expect(result[0]).to.eql({ text: "Patterns (nicht nur im Code", weight: 1, html: { class: "interestify" } });
      expect(result[1]).to.eql({ text: "sondern vor allem beim Lernen)", weight: 1, html: { class: "interestify" } });
    });
  });

  describe("avatar functions", () => {
    let saveMember;
    let getImageFromAvatarProvider;
    let gravatarData;

    beforeEach(() => {
      saveMember = sinon.stub(memberstore, "saveMember");
      gravatarData = { image: "the image", hasNoImage: false };
      getImageFromAvatarProvider = sinon.stub(avatarProvider, "getImage").returns(gravatarData);
    });

    it("updates a member with information about a saved avatar", async () => {
      const files = { image: [{ path: imagePath }] };
      const params = {};
      await membersService.saveCustomAvatarForNickname("hada", files, params);
      expect(saveMember.called).to.be(true);
      const mem = saveMember.args[0][0];
      expect(mem.hasCustomAvatar()).to.be.true();
    });

    it("removes information from member about a deleted avatar", async () => {
      const files = { image: [{ path: imagePath }] };
      const params = {};
      member.state.customAvatar = "assa.jpg";
      await membersService.saveCustomAvatarForNickname("hada", files, params);
      await membersService.deleteCustomAvatarForNickname("hada");
      expect(saveMember.called).to.be(true);
      const mem = saveMember.args[0][0];
      expect(mem.hasCustomAvatar()).to.be.false();
    });

    it("loads the custom avatar mini picture into the member", async () => {
      const files = { image: [{ path: imagePath }] };
      const params = {};
      member.state.nickname = "hada";
      await membersService.saveCustomAvatarForNickname("hada", files, params);
      await membersService.putAvatarIntoMemberAndSave(member);
      expect(member.inlineAvatar()).to.match(/^data:image\/jpeg;base64,\/9j/);
    });

    it("updating the avatar from gravatar does not happen when there is a custom avatar", async () => {
      const files = { image: [{ path: imagePath }] };
      const params = {};
      member.state.nickname = "hada";
      await membersService.saveCustomAvatarForNickname("hada", files, params);
      await membersService.updateImage(member);
      expect(member.inlineAvatar()).to.match(/^data:image\/jpeg;base64,\/9j/);
    });

    it("does not load any image into the member if the member's custom avatar cannot be found", async () => {
      member.state.customAvatar = "myNonexistentPic.jpg";
      expect(member.inlineAvatar()).to.match("");

      await membersService.putAvatarIntoMemberAndSave(member);
      expect(member.inlineAvatar()).to.match("");
    });

    it("a member without a custom avatar loads it from gravatar and persists it", async () => {
      await membersService.putAvatarIntoMemberAndSave(member);
      expect(member.state.avatardata).to.be(gravatarData);
      expect(getImageFromAvatarProvider.called).to.be(true);
      expect(saveMember.called).to.be(true);
    });

    it("a member takes the persisted one if it is actual enough", async () => {
      member.state.avatardata = gravatarData;
      membersService.putAvatarIntoMemberAndSave(member);
      expect(member.state.avatardata).to.be(gravatarData);
      expect(getImageFromAvatarProvider.called).to.be(false);
      expect(saveMember.called).to.be(false);
    });

    it("loads it again if it is potentially outdated and saves it even though it is equal", async () => {
      member.state.avatardata = { image: "the image", hasNoImage: false };

      await membersService.updateImage(member);
      expect(member.state.avatardata.image).to.eql(gravatarData.image);
      expect(getImageFromAvatarProvider.called).to.be(true);
      expect(saveMember.called).to.be(true);
    });

    it("loads it again if it is potentially outdated but does not save it if it is equal", async () => {
      member.state.avatardata = {
        image: "another image",
        hasNoImage: false,
      };
      await membersService.updateImage(member);
      expect(member.state.avatardata).to.be(gravatarData);
      expect(getImageFromAvatarProvider.called).to.be(true);
      expect(saveMember.called).to.be(true);
    });
  });

  describe('"findMember" function', () => {
    let saveMember;

    beforeEach(() => {
      saveMember = sinon.stub(memberstore, "saveMember");

      sinon.stub(memberstore, "getMemberForAuthentication").callsFake((auth) => {
        if (!auth || auth === "newAuth") {
          return;
        }
        if (auth === "errorAuth") {
          throw new Error("error in getMemberForAuthentication");
        }
        return member;
      });
    });

    describe("if nobody is logged in", () => {
      it("returns no member if the authentication is undefined", (done) => {
        membersService.findMemberFor(null, undefined, (err, returnedMember) => {
          expect(returnedMember).to.not.exist();
          expect(saveMember.called).to.be(false);
          done(err);
        })();
      });

      it("returns no member if the authentication is not known", (done) => {
        membersService.findMemberFor(null, "newAuth", (err, returnedMember) => {
          expect(returnedMember).to.not.exist();
          expect(saveMember.called).to.be(false);
          done(err);
        })();
      });

      it("returns an error if there is an error in getMemberForAuthentication", (done) => {
        membersService.findMemberFor(null, "errorAuth", (err, returnedMember) => {
          expect(returnedMember).to.not.exist();
          expect(saveMember.called).to.be(false);
          expect(err).to.exist();
          done();
        })();
      });

      it("returns a member if his authentication is known", (done) => {
        membersService.findMemberFor(null, "knownAuth", (err, returnedMember) => {
          expect(returnedMember).to.be(member);
          expect(saveMember.called).to.be(false);
          done(err);
        })();
      });
    });

    describe("if the user is logged in", () => {
      it("adds the new authentication to the sessionmember if authentication not known yet", (done) => {
        const differentMember = new Member();
        differentMember.state.id = "different ID";
        const user = { member: differentMember };
        membersService.findMemberFor(user, "newAuth", (err, returnedMember) => {
          expect(returnedMember).to.be(differentMember);
          expect(saveMember.called).to.be(true);
          expect(saveMember.args[0][0]).is(differentMember);
          expect(differentMember.authentications()).to.contain("newAuth");

          done(err);
        })();
      });

      it("returns an error if getMemberForAuthentication returns an error", (done) => {
        const differentMember = new Member();
        differentMember.state.id = "different ID";
        const user = { member: differentMember };
        membersService.findMemberFor(user, "errorAuth", (err, returnedMember) => {
          expect(returnedMember).to.not.exist();
          expect(saveMember.called).to.be(false);
          expect(err).to.exist();
          done();
        })();
      });

      it("simply returns the found member if the authentication is already known", (done) => {
        member.state.id = "ID";
        const user = { member };
        membersService.findMemberFor(user, "authID", (err, returnedMember) => {
          expect(returnedMember).to.be(member);
          expect(saveMember.called).to.be(false);
          done(err);
        })();
      });

      it("returns an error if the found member is not the logged in member", (done) => {
        member.state.id = "ID";
        const differentMember = new Member();
        differentMember.state.id = "different ID";
        const user = { member: differentMember };
        membersService.findMemberFor(user, "authID", (err, returnedMember) => {
          expect(returnedMember).to.not.exist();
          expect(saveMember.called).to.be(false);
          expect(err).to.exist();
          done();
        })();
      });
    });
  });
});
