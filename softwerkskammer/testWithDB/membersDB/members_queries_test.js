"use strict";

require("../../testutil/configureForTest");

const expect = require("must-dist");

const memberstore = require("../../lib/members/memberstore");
const persistence = require("../../lib/members/membersPersistence");
const Member = require("../../lib/members/member");

describe("Members application with DB", () => {
  describe("getMembersWithInterest", () => {
    const member = new Member({ id: "id", interests: "a, bb, c d e,f g h ,ü+p" });

    beforeEach(() => {
      // if this fails, you need to start your mongo DB
      persistence.recreateForTest();
      memberstore.saveMember(member);
    });

    it("finds a member by simple interest", () => {
      const members = memberstore.getMembersWithInterest("a", "i");
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be("id");
    });

    it('finds a member by interest with umlaut and "+"', () => {
      const members = memberstore.getMembersWithInterest("ü+p", "i");
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be("id");
    });

    it("finds a member by interest with spaces (case 1)", () => {
      const members = memberstore.getMembersWithInterest("c d e", "i");
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be("id");
    });

    it("finds a member by interest with spaces (case 2)", () => {
      const members = memberstore.getMembersWithInterest("f g h", "i");
      expect(members).to.have.length(1);
      expect(members[0].id()).to.be("id");
    });

    it("does not find a member by partial matches of an interest", () => {
      const members = memberstore.getMembersWithInterest("b", "i");
      expect(members).to.have.length(0);
    });

    it("does not find a member when searching case sensitive", () => {
      const members = memberstore.getMembersWithInterest("Bb", "");
      expect(members).to.have.length(0);
    });
  });

  describe("allMembers", () => {
    const swkMember = new Member({ id: "id1" });
    beforeEach(() => {
      // if this fails, you need to start your mongo DB
      persistence.recreateForTest();
      memberstore.saveMember(swkMember);
    });

    it("finds all members", () => {
      const members = memberstore.allMembers();
      expect(members).to.have.length(1);
      expect(members[0].id()).is("id1");
    });
  });
});
