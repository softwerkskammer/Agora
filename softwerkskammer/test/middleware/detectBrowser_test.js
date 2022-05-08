"use strict";

const beans = require("../../testutil/configureForTest").get("beans");
const detectBrowser = beans.get("detectBrowser");
const expect = require("must-dist");

describe("Detecting Browser", () => {
  function checkUserAgent(string) {
    const req = { headers: { "user-agent": string } };
    const res = { locals: {} };
    const next = () => undefined;
    detectBrowser(req, res, next);
    return res.locals.browserIsTooOld;
  }

  it("detects old IE successfully", () => {
    expect(
      checkUserAgent(
        "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; WOW64; Trident/4.0; SLCC2; Media Center PC 6.0; InfoPath.2; MS-RTC LM 8)"
      )
    ).to.be(true);
    expect(
      checkUserAgent(
        "Mozilla/5.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0; GTB7.4; InfoPath.2; SV1; .NET CLR 3.3.69573; WOW64; en-US)"
      )
    ).to.be(true);
    expect(checkUserAgent("Mozilla/4.0 (Windows; MSIE 7.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727)")).to.be(true);
  });

  it("detects new IE successfully", () => {
    expect(
      checkUserAgent(
        "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; WOW64; Trident/5.0; SLCC2; Media Center PC 6.0; InfoPath.3; MS-RTC LM 8; Zune 4.7)"
      )
    ).to.be(false);
    expect(checkUserAgent("Mozilla/5.0 (compatible; MSIE 10.0; Macintosh; Intel Mac OS X 10_7_3; Trident/6.0)")).to.be(
      false
    );
  });

  it("detects anything else successfully", () => {
    expect(checkUserAgent("anything")).to.be(false);
    expect(
      checkUserAgent(
        "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1"
      )
    ).to.be(false);
  });
});
