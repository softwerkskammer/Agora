"use strict";

const conf = require("../../testutil/configureForTest");
const beans = conf.get("beans");
const expressSessionConfigurator = beans.get("expressSessionConfigurator");
const MemoryStore = require("express-session").MemoryStore;
const expect = require("must-dist");

describe("Configuration sets Persistent Store only if configured", () => {
  it("to RAM Store", () => {
    const req = {
      originalUrl: "/something",
      headers: {},
      cookies: {},
      signedCookies: {},
    };
    const next = () => "";
    expressSessionConfigurator(req, {}, next);

    expect(conf.get("dontUsePersistentSessions")).to.be(true);
    expect(req.sessionStore).to.be.a(MemoryStore);
  });
});
