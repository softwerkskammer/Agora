"use strict";

const request = require("supertest");
const sinon = require("sinon").createSandbox();

const beans = require("../../testutil/configureForTest").get("beans");

const Member = require("../../lib/members/member");
const memberstore = beans.get("memberstore");

const app = require("../../testutil/testHelper")("membersApp").createApp();

describe("Members application checks", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("for email", () => {
    it("validates a duplicate email address via ajax - email is same as previous", (done) => {
      request(app)
        .get("/checkemail?email=my.mail@yourmail.de&previousEmail=my.mail@yourmail.de")
        .expect(200)
        .expect("true", done);
    });

    it("validates a duplicate email address via ajax - email is not taken and different to previous", (done) => {
      sinon.stub(memberstore, "getMemberForEMail").returns(null);
      request(app)
        .get("/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de")
        .expect(200)
        .expect("true", done);
    });

    it("validates a duplicate email address via ajax - email is taken and different to previous", (done) => {
      sinon.stub(memberstore, "getMemberForEMail").returns(new Member());
      request(app)
        .get("/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de")
        .expect(200)
        .expect("false", done);
    });

    it("validates a duplicate email address via ajax - email query yields and error and email is different to previous", (done) => {
      sinon.stub(memberstore, "getMemberForEMail").throws(new Error());
      request(app)
        .get("/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de")
        .expect(200)
        .expect("false", done);
    });
  });

  describe("for nickname", () => {
    it("validates a duplicate nickname via ajax - nickname is same as previous", (done) => {
      request(app)
        .get("/checknickname?nickname=nickerinack&previousNickname=nickerinack")
        .expect(200)
        .expect("true", done);
    });

    it("validates a duplicate nickname via ajax - nickname is not taken and different to previous", (done) => {
      sinon.stub(memberstore, "getMember").returns(null);
      request(app).get("/checknickname?nickname=nickerinack&previousNickname=bibabu").expect(200).expect("true", done);
    });

    it("validates a duplicate nickname via ajax - nickname is taken and different to previous", (done) => {
      sinon.stub(memberstore, "getMember").returns(new Member());
      request(app).get("/checknickname?nickname=nickerinack&previousNickname=bibabu").expect(200).expect("false", done);
    });

    it("validates a duplicate nickname via ajax - nickname query yields and error and email is different to previous", (done) => {
      sinon.stub(memberstore, "getMember").throws(new Error());
      request(app).get("/checknickname?nickname=nickerinack&previousNickname=bibabu").expect(200).expect("false", done);
    });
  });
});
