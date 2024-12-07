"use strict";

const expect = require("must-dist");

const redirectIfNotSuperuser = require("../../lib/middleware/secureSuperuserOnly");

describe("redirectIfNotSuperuser", () => {
  it("happpens when a normal user wants to access administraton pages", (done) => {
    const originalUrl = "/administration/something";

    const req = { originalUrl };

    const accessrights = {};
    accessrights.isRegistered = () => true;
    accessrights.isSuperuser = () => false;

    const res = { locals: { accessrights } };
    // we do want the redirection to be invoked:
    res.redirect = (args) => {
      expect(args).to.exist();
      done();
    };

    redirectIfNotSuperuser(req, res, () => {
      done(new Error("We should have hit the redirect"));
    });
  });

  it('does not happpen when a normal user wants to access a page with "administration" as part of the URL', (done) => {
    const originalUrl = "/member/administration/";

    const req = { originalUrl };

    const accessrights = {};
    accessrights.isRegistered = () => true;
    accessrights.isSuperuser = () => false;

    const res = { locals: { accessrights } };
    // we do not want the redirection to be invoked:
    res.redirect = (args) => {
      expect(args).to.exist();
      done(new Error("We should not have hit the redirect"));
    };

    redirectIfNotSuperuser(req, res, () => {
      done();
    });
  });
});
