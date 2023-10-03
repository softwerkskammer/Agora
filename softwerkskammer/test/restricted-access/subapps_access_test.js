"use strict";

require("../../testutil/configureForTest");

const app = require("../../app").create();
const request = require("supertest");
const theApp = request(app);

describe("Security for normal visitors does not allow to access ", () => {
  async function checkGetUrlForRedirection(url) {
    return theApp.get(url).expect(302).expect("location", /login/);
  }

  async function checkPostUrlForRedirection(url) {
    return theApp.post(url).expect(302).expect("location", /login/);
  }

  it("GET URLs", async () => {
    [
      "/activities/new",
      "/activities/newLike/other",
      "/activities/edit/EventA",
      "/activities/addon/someActivity",
      "/activities/addons/someActivity",
      "/activities/payment/someActivity",
      "/activities/paymentReceived/someActivity",
      "/gallery/some-image",
      "/groups/new",
      "/groups/edit/GroupA",
      "/mailsender/something",
      "/invitation",
      "/members/",
      "/members/new",
      "/members/edit/nick",
      "/members/nick",
      "/dashboard/",
    ].forEach(async (url) => await checkGetUrlForRedirection(url));
  });

  it("POST URLs", async () => {
    [
      "/activities/submit",
      "/activities/subscribe",
      "/activities/addToWaitinglist",
      "/gallery/",
      "/groups/submit",
      "/groups/subscribe/GroupA",
      "/members/submit",
    ].forEach(async (url) => await checkPostUrlForRedirection(url));
  });
});
