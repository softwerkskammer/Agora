"use strict";

const request = require("supertest");

const app = require("../../testutil/testHelper")("siteApp").createApp();

describe("The router for the site' pages", () => {
  it("redirects after switching the language", (done) => {
    request(app)
      .get("/language/de?currentUrl=%2Fpeter%2F")
      .expect(302)
      .expect("location", /\/peter\//, done);
  });

  it("calculates a qrcode", (done) => {
    request(app).get("/qrcode?url=%2Fpeter%2F").expect(200).expect("Content-Type", "image/svg+xml", done);
  });
});
