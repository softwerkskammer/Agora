"use strict";

const request = require("supertest");
const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const csurf = require("csurf");
const beans = require("../../testutil/configureForTest").get("beans");

const setupApp = require("../../testutil/testHelper");
const memberstore = beans.get("memberstore");
const groupstore = beans.get("groupstore");
const groupsAndMembersService = beans.get("groupsAndMembersService");
const Member = require("../../lib/members/member");
const addCsrfTokenToLocals = beans.get("addCsrfTokenToLocals");
const serverpathRemover = beans.get("serverpathRemover");

describe("Security regarding", () => {
  describe("Clickjacking:", () => {
    beforeEach(() => {
      sinon.stub(memberstore, "allMembers").returns([]);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("sends an X-Frame-Options header with param DENY", (done) => {
      const app = setupApp("membersApp").createApp({ middlewares: [beans.get("secureAgainstClickjacking")] });

      request(app).get("/").expect("X-Frame-Options", "DENY", done);
    });
  });

  describe("Cross-Site-Request-Forgery:", () => {
    beforeEach(() => {
      const dummymember = new Member({
        id: "memberId",
        nickname: "hada",
        email: "a@b.c",
        site: "http://my.blog",
        firstname: "Hans",
        lastname: "Dampf",
        authentications: [],
        subscribedGroups: [],
      });
      sinon.stub(groupstore, "allGroups").returns([]);
      sinon.stub(groupsAndMembersService, "getMemberWithHisGroups").returns(dummymember);
      sinon.stub(memberstore, "allMembers").returns([dummymember]);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("creates a CSRF token and adds it to the edit form", (done) => {
      const app = setupApp("membersApp").createApp({ id: "memberId", middlewares: [csurf()] });

      request(app)
        .get("/edit/hada")
        .expect(/input type="hidden" name="_csrf"/, done);
    });

    it("blocks updates that do not come with a csrf token", (done) => {
      // we need to load accessrights and pug support code before the csrf handling
      const app = setupApp("membersApp").createApp({
        id: "memberId",
        middlewares: [
          require("../../lib/middleware/accessrights"),
          beans.get("serverpathRemover"),
          csurf(),
          addCsrfTokenToLocals,
        ],
      });
      request(app)
        .post("/submit")
        .send(
          "id=memberId&firstname=A&lastname=B&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z&email=here@there.org&previousEmail=here@there.org",
        )
        .expect(403)
        .expect(/Du hast einen Fehler gefunden\./)
        .expect(/Error: invalid csrf token/, done);
    });

    it("csrf middleware adds the csrf token to res.locals", () => {
      const csrftoken = "csrf token";
      const req = { csrfToken: () => csrftoken };
      const res = { locals: {} };
      const next = () => undefined;

      addCsrfTokenToLocals(req, res, next);

      expect(res.locals.csrf_token).to.equal(csrftoken);
    });
  });

  describe("Information disclosure", () => {
    beforeEach(() => {
      sinon.stub(memberstore, "getMember").returns(null);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("does not happen through paths in server error messages", (done) => {
      const app = setupApp("mailsenderApp").createApp({ middlewares: [serverpathRemover] });

      request(app)
        .get("/contactMember/xyz")
        .expect(500)
        // node_modules and lib are preceded by an opening paren, thus the path preceding them is cut off:
        .expect(/\(softwerkskammer\/lib/)
        // we are on the right page, btw:
        .expect(/Du hast einen Fehler gefunden\./, done);
    });
  });
});
