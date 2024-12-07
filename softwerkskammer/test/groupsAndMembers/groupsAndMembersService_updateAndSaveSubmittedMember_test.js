"use strict";

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const Member = require("../../lib/members/member");
const memberstore = require("../../lib/members/memberstore");
const groupsAndMembersService = require("../../lib/groupsAndMembers/groupsAndMembersService");
const groupsService = require("../../lib/groups/groupsService");

describe("Groups and Members Service (updateAndSaveSubmittedMember)", () => {
  let accessrights;

  beforeEach(() => {
    accessrights = {
      isSuperuser: () => false,
      canEditMember: () => false,
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  const memberformData = { previousNickname: "nick", nickname: "nick in memberform" };
  const member = new Member({ id: "memberId", nickname: "nick nack" });

  describe("when some error occurs", () => {
    it("returns an error when the member loading caused an error", () => {
      sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").throws(new Error("some error"));

      let nickname;
      try {
        nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
          undefined,
          { previousNickname: "nick" },
          accessrights,
          undefined,
        );
      } catch (err) {
        expect(err.message).to.equal("some error");
        expect(nickname).to.be.undefined();
      }
    });

    it("returns an error when the submitted member is a new member and saving the member caused an error", () => {
      sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").returns(null);
      sinon.stub(memberstore, "saveMember").throws(new Error("some error"));

      let nickname;
      try {
        nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
          undefined,
          { previousNickname: "nick" },
          accessrights,
          undefined,
        );
        expect(true).to.be(false);
      } catch (err) {
        expect(err.message).to.equal("some error");
        expect(nickname).to.be.undefined();
      }
    });

    it("returns an error when the submitted member is an existing member and we are allowed to edit the member but saving causes an error", () => {
      sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").returns(member);
      accessrights.canEditMember = () => true;
      sinon.stub(memberstore, "saveMember").throws(new Error("some error"));

      let nickname;
      try {
        nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
          undefined,
          memberformData,
          accessrights,
          undefined,
        );
      } catch (err) {
        expect(err.message).to.equal("some error");
        expect(nickname).to.be.undefined();
      }
    });
  });

  describe("when the submitted member is a new member", () => {
    beforeEach(() => {
      sinon.stub(memberstore, "saveMember");
      sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").returns(null);
      sinon.stub(groupsService, "updateSubscriptions").callsFake(() => {});
    });

    it("adds the new member to the sessionUser", () => {
      const sessionUser = { authenticationId: "member authentication id" };
      accessrights.canEditMember = () => true;

      const nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
        sessionUser,
        memberformData,
        accessrights,
        () => {},
      );
      expect(nickname).to.equal("nick in memberform");
      expect(sessionUser.member.id()).to.equal("member authentication id");
    });
  });

  describe("when the submitted member is an existing member", () => {
    beforeEach(() => {
      sinon.stub(memberstore, "saveMember");
      sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").returns(member);
      sinon.stub(groupsService, "updateSubscriptions").callsFake(() => {});
    });

    it("returns null when we are not allowed to edit the member", () => {
      const nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
        undefined,
        memberformData,
        accessrights,
        undefined,
      );
      expect(nickname).to.be.undefined();
    });

    it("adds the member to and removes the profile from the sessionUser when the sessionUser does not contain a member", () => {
      const sessionUser = { profile: {} };
      accessrights.canEditMember = () => true;

      const nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
        sessionUser,
        memberformData,
        accessrights,
        undefined,
      );
      expect(nickname).to.equal("nick in memberform");
      expect(sessionUser.member).to.equal(member);
      expect(sessionUser.profile).to.be(undefined);
    });

    it("modifies the sessionUser when the sessionUser contains a member with the same id", () => {
      const differentMemberWithSameId = new Member({ id: "memberId" });
      const sessionUser = { member: differentMemberWithSameId };
      accessrights.canEditMember = () => true;

      const nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
        sessionUser,
        memberformData,
        accessrights,
        undefined,
      );
      expect(nickname).to.equal("nick in memberform");
      expect(sessionUser.member).to.equal(member);
      expect(sessionUser.member).to.not.equal(differentMemberWithSameId);
    });

    it("does not modify the sessionUser when the sessionUser contains a member with a different id", () => {
      const anotherMember = new Member({ id: "anotherMemberId" });
      const sessionUser = { member: anotherMember };
      accessrights.canEditMember = () => true;

      const nickname = groupsAndMembersService.updateAndSaveSubmittedMember(
        sessionUser,
        memberformData,
        accessrights,
        undefined,
      );
      expect(nickname).to.equal("nick in memberform");
      expect(sessionUser.member).to.equal(anotherMember);
    });
  });
});
