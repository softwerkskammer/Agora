"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTestWithDB").get("beans");
const memberstore = beans.get("memberstore");
const persistence = beans.get("membersPersistence");
const Member = beans.get("member");

describe("Members application with DB", () => {
  describe("getMembersWithInterest", () => {
    const member = new Member({ id: "id", interests: "a, bb, c d e,f g h ,ü+p" });

    beforeEach((done) => {
      // if this fails, you need to start your mongo DB
      persistence.drop(() => {
        memberstore.saveMember(member, (err) => {
          done(err);
        });
      });
    });

    it("finds a member by simple interest", (done) => {
      memberstore.getMembersWithInterest("a", "i", (err, members) => {
        expect(members).to.have.length(1);
        expect(members[0].id()).to.be("id");
        done(err);
      });
    });

    it('finds a member by interest with umlaut and "+"', (done) => {
      memberstore.getMembersWithInterest("ü+p", "i", (err, members) => {
        expect(members).to.have.length(1);
        expect(members[0].id()).to.be("id");
        done(err);
      });
    });

    it("finds a member by interest with spaces (case 1)", (done) => {
      memberstore.getMembersWithInterest("c d e", "i", (err, members) => {
        expect(members).to.have.length(1);
        expect(members[0].id()).to.be("id");
        done(err);
      });
    });

    it("finds a member by interest with spaces (case 2)", (done) => {
      memberstore.getMembersWithInterest("f g h", "i", (err, members) => {
        expect(members).to.have.length(1);
        expect(members[0].id()).to.be("id");
        done(err);
      });
    });

    it("does not find a member by partial matches of an interest", (done) => {
      memberstore.getMembersWithInterest("b", "i", (err, members) => {
        expect(members).to.have.length(0);
        done(err);
      });
    });

    it("does not find a member when searching case sensitive", (done) => {
      memberstore.getMembersWithInterest("Bb", "", (err, members) => {
        expect(members).to.have.length(0);
        done(err);
      });
    });
  });

  describe("allMembers", () => {
    const swkMember = new Member({ id: "id1" });
    beforeEach((done) => {
      // if this fails, you need to start your mongo DB
      persistence.drop(() => {
        memberstore.saveMember(swkMember, done);
      });
    });

    it("finds all members", (done) => {
      memberstore.allMembers((err, members) => {
        expect(members).to.have.length(1);
        expect(members[0].id()).is("id1");
        done(err);
      });
    });
  });
});
