"use strict";

const sinon = require("sinon");
const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const redirectRuleForNewUser = beans.get("redirectRuleForNewUser");
const secureSuperuserOnly = beans.get("secureSuperuserOnly");
const accessrights = require("../../lib/middleware/accessrights");
const Member = require("../../lib/members/member");

describe("redirection to registration page for authenticated but not yet registered users", () => {
  function checkFor(urlAndRedirect) {
    const req = {
      originalUrl: urlAndRedirect.url,
      user: {},
    };
    const res = {
      redirect: sinon.spy(),
    };
    const next = sinon.spy();
    redirectRuleForNewUser(req, res, next);
    expect(res.redirect.calledWith("/members/new")).to.equal(urlAndRedirect.redirect);
    expect(next.called).to.not.equal(urlAndRedirect.redirect);
  }

  it("(almost) generally happens", () => {
    checkFor({ url: "/something", redirect: true });
  });

  it("happens for /something/new", () => {
    checkFor({ url: "/something/new", redirect: true });
  });

  it("does not happen for /members/new", () => {
    checkFor({ url: "/members/new", redirect: false });
  });

  it("happens for /something/submit", () => {
    checkFor({ url: "/something/submit", redirect: true });
  });

  it("does not happen for members/submit", () => {
    checkFor({ url: "/members/submit", redirect: false });
  });

  it("does not happen for /members/checknickname", () => {
    checkFor({ url: "/members/checknickname", redirect: false });
  });

  it("does not happen for /auth/logout", () => {
    checkFor({ url: "/auth/logout", redirect: false });
  });

  it("does not happen for frontend scripts", () => {
    checkFor({ url: "/clientscripts/", redirect: false });
  });

  it("does not happen for frontend stylesheets", () => {
    checkFor({ url: "/stylesheets/", redirect: false });
  });

  it("does not happen for frontend fonts", () => {
    checkFor({ url: "/fonts/", redirect: false });
  });

  it("does not happen for frontend images", () => {
    checkFor({ url: "/img/", redirect: false });
  });
});

describe("redirection to registration page for registered users", () => {
  it("does not happen", () => {
    const req = {
      originalUrl: "/members",
      user: {
        member: {},
      },
    };
    const next = sinon.spy();
    redirectRuleForNewUser(req, {}, next);
    expect(next.called).to.be(true);
  });
});

describe("redirection to registration page for anonymous users", () => {
  it("does not happen", () => {
    const req = {
      originalUrl: "/members",
    };
    const next = sinon.spy();
    redirectRuleForNewUser(req, {}, next);
    expect(next.called).to.be(true);
  });
});

describe("exceptions to the admin guard", () => {
  it("allows anonymous users to create their profile", () => {
    const req = {
      originalUrl: "/members/new",
      user: {},
    };
    const res = { locals: {} };
    accessrights(req, res, () => undefined);
    const next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

  it("allows anonymous users to save their profile", () => {
    const req = {
      originalUrl: "/members/submit",
      user: {},
    };
    const res = { locals: {} };
    accessrights(req, res, () => undefined);
    const next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

  it("allows registered users to edit their profile", () => {
    const req = {
      originalUrl: "/members/edit/nick",
      user: {
        member: new Member({ nickname: "nick" }),
      },
    };
    const res = { locals: {} };
    accessrights(req, res, () => undefined);
    const next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

  it("allows registered users to edit their profile even with blanks in nickname", () => {
    const req = {
      originalUrl: "/members/edit/nick%20name",
      user: {
        member: new Member({ nickname: "nick name" }),
      },
    };
    const res = { locals: {} };
    accessrights(req, res, () => undefined);
    const next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });

  it("allows registered users to save their profile", () => {
    const req = {
      originalUrl: "/members/submit",
      user: {
        member: new Member({ id: "id" }),
      },
      body: { id: "id" },
    };
    const res = { locals: {} };
    accessrights(req, res, () => undefined);
    const next = sinon.spy();
    secureSuperuserOnly(req, res, next);
    expect(next.called).to.be(true);
  });
});
