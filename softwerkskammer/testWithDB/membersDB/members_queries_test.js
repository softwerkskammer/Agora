"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const memberstore = beans.get("memberstore");
const persistence = beans.get("membersPersistence");
const Member = beans.get("member");

describe("Members application with DB", () => {
  describe("getMembersWithInterest", () => {
    const member = new Member({ id: "id", interests: "a, bb, c d e,f g h ,ü+p" });

    beforeEach(async () => {
      // if this fails, you need to start your mongo DB
      await persistence.dropMongoCollection();
      await memberstore.saveMember(member);
    });

    it("finds a member by simple interest", async () => {
      const members = await memberstore.getMembersWithInterest("a", "i");
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be("id");
    });

    it('finds a member by interest with umlaut and "+"', async () => {
      const members = await memberstore.getMembersWithInterest("ü+p", "i");
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be("id");
    });

    it("finds a member by interest with spaces (case 1)", async () => {
      const members = await memberstore.getMembersWithInterest("c d e", "i");
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be("id");
    });

    it("finds a member by interest with spaces (case 2)", async () => {
      const members = await memberstore.getMembersWithInterest("f g h", "i");
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be("id");
    });

    it("does not find a member by partial matches of an interest", async () => {
      const members = await memberstore.getMembersWithInterest("b", "i");
      expect(members).to.have.length(0);
    });

    it("does not find a member when searching case sensitive", async () => {
      const members = await memberstore.getMembersWithInterest("Bb", "");
      expect(members).to.have.length(0);
    });
  });

  describe("allMembers", () => {
    const swkMember = new Member({ id: "id1" });
    beforeEach(async () => {
      // if this fails, you need to start your mongo DB
      await persistence.dropMongoCollection();
      await memberstore.saveMember(swkMember);
    });

    it("finds all members", async () => {
      const members = await memberstore.allMembers();
      expect(members).to.have.length(1);
      expect(members[0].id()).is("id1");
    });
  });
});
