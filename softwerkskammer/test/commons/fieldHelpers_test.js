"use strict";

const beans = require("../../testutil/configureForTest").get("beans");
const fieldHelpers = require("../../lib/commons/fieldHelpers");
require("../../lib/middleware/initI18N");
const expect = require("must-dist");

describe("Activity application", () => {
  it("removes all special characters from the id string", () => {
    const id = fieldHelpers.createLinkFrom(["assignedGroup", "title", "startDate"]);
    expect(id).to.equal("assignedGroup_title_startDate");

    const tmpId = fieldHelpers.createLinkFrom(["assignedGroup", "?!tit le?!", "2012-11-11"]);
    expect(tmpId).to.equal("assignedGroup___tit_le___2012-11-11");
  });
});

describe("Replace email addresses from text", () => {
  it("returns the input if it is null or undefined", () => {
    expect(fieldHelpers.replaceMailAddresses(null)).to.equal(null);
    expect(fieldHelpers.replaceMailAddresses(undefined)).to.equal(undefined);
  });

  it("does not replace a single @ sign", () => {
    expect(fieldHelpers.replaceMailAddresses("@")).to.equal("@");
  });

  it("does not replace an @ sign when it is not in an email (no dots)", () => {
    expect(fieldHelpers.replaceMailAddresses("Seti@Home")).to.equal("Seti@Home");
  });

  it("does not replace an @ sign when it is not in an email (suffix too long)", () => {
    expect(fieldHelpers.replaceMailAddresses("I stay@Hans.Dampf")).to.equal("I stay@Hans.Dampf");
  });

  it("replaces a single email address", () => {
    const result = fieldHelpers.replaceMailAddresses("Hans.Dampf_1@moby-dick.de");

    expect(result).to.equal("...@...");
  });

  it("replaces an email address in a text", () => {
    const result = fieldHelpers.replaceMailAddresses("many thanks to hans.dampf@moby-dick.de who sent me this link");

    expect(result).to.equal("many thanks to ...@... who sent me this link");
  });

  it("replaces an email address in a quoted mail", () => {
    const result = fieldHelpers.replaceMailAddresses("31.12.2005, Hans Dampf <hans_dampf.@mymail.org>:");

    expect(result).to.equal("31.12.2005, Hans Dampf <...@...>:");
  });

  it("replaces multiple email addresses", () => {
    const result = fieldHelpers.replaceMailAddresses(
      "erna.meier@hihi.com and Hans Dampf <hans_dampf.@mymail.org>tester@system.url",
    );

    expect(result).to.equal("...@... and Hans Dampf <...@...>...@...");
  });
});

describe("Replace long numbers from text", () => {
  it("returns the input if it is null or undefined", () => {
    expect(fieldHelpers.replaceLongNumbers(null)).to.equal(null);
    expect(fieldHelpers.replaceLongNumbers(undefined)).to.equal(undefined);
  });

  it("does not replace text without digits", () => {
    expect(fieldHelpers.replaceLongNumbers("bla bli blu")).to.equal("bla bli blu");
  });

  it("does not replace text with single brackets, slashes, plus or minus signs", () => {
    expect(fieldHelpers.replaceLongNumbers("text - text + text (text) / text")).to.equal(
      "text - text + text (text) / text",
    );
  });

  it("does not replace years", () => {
    expect(fieldHelpers.replaceLongNumbers(" 20.12.2011 ")).to.equal(" 20.12.2011 ");
  });

  it("does not replace postal numbers", () => {
    expect(fieldHelpers.replaceLongNumbers(" 77123 Testhausen ")).to.equal(" 77123 Testhausen ");
  });

  it("replaces six or more digits", () => {
    expect(fieldHelpers.replaceLongNumbers(" 123456 ")).to.equal(" ... ");
  });

  it("replaces phone number with parentheses", () => {
    expect(fieldHelpers.replaceLongNumbers(" (040) 334455 ")).to.equal(" ... ");
  });

  it("replaces phone number with parentheses and spaces", () => {
    expect(fieldHelpers.replaceLongNumbers("(040) 33 44 55")).to.equal("...");
  });

  it("replaces phone number with long pre-dial in parentheses and spaces", () => {
    expect(fieldHelpers.replaceLongNumbers("(0 40 35) 33 44 55")).to.equal("...");
  });

  it("replaces phone number with slash", () => {
    expect(fieldHelpers.replaceLongNumbers("040/334455")).to.equal("...");
  });

  it("replaces phone number with slash and spaces", () => {
    expect(fieldHelpers.replaceLongNumbers("040 / 33 44 55")).to.equal("...");
  });

  it("replaces phone number with dash", () => {
    expect(fieldHelpers.replaceLongNumbers("040-334455")).to.equal("...");
  });

  it("replaces phone number with dash and spaces", () => {
    expect(fieldHelpers.replaceLongNumbers("040 - 33 44 55")).to.equal("...");
  });

  it("replaces phone number with country code", () => {
    expect(fieldHelpers.replaceLongNumbers("+4940334455")).to.equal("...");
  });

  it("replaces phone number with country code and spaces", () => {
    expect(fieldHelpers.replaceLongNumbers("+49 40 33 44 55")).to.equal("...");
  });

  it("replaces phone number with country code and parentheses and spaces", () => {
    expect(fieldHelpers.replaceLongNumbers("+49 (40) 33 44 55")).to.equal("...");
  });

  it("replaces phone number with country code and funny zero and spaces", () => {
    expect(fieldHelpers.replaceLongNumbers("+49 (0) 40 33 44 55")).to.equal("...");
  });

  it("replaces phone number with dial-through", () => {
    expect(fieldHelpers.replaceLongNumbers("(040) 33 44 55 - 66")).to.equal("...");
  });
});

describe("killHtmlHead", () => {
  it("does not change text not containing a html head element", () => {
    expect(fieldHelpers.killHtmlHead(null)).to.equal(null);
    expect(fieldHelpers.killHtmlHead("")).to.equal("");
    expect(fieldHelpers.killHtmlHead("<html>bla</html>")).to.equal("<html>bla</html>");
  });

  it("strips HTML <head></head> completely from text", () => {
    expect(fieldHelpers.killHtmlHead("<head></head>")).to.equal("");
    expect(fieldHelpers.killHtmlHead("<head>bla</head>")).to.equal("");
    expect(fieldHelpers.killHtmlHead("123<head>bla</head>321")).to.equal("123321");
  });

  it("strips HTML <head></head> completely from text even when containing newlines", () => {
    expect(fieldHelpers.killHtmlHead("<head>bl\na</head>")).to.equal("");
    expect(fieldHelpers.killHtmlHead("123<head>\nbl\na</head>321")).to.equal("123321");
  });

  it("strips HTML <head></head> completely from text even when text very long", () => {
    expect(
      fieldHelpers.killHtmlHead(
        "123<head>\nbl\na</head>321 321 321 321 321 321 321 321 321 321 321 321 321 321 " +
          "321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 ",
      ),
    ).to.equal(
      "123321 321 321 321 321 321 321 321 321 321 321 321 321 321 " +
        "321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 321 ",
    );
  });
});

describe("parseToDateTimetUsingTimezone function", () => {
  it("parses past time in winter", () => {
    const result = fieldHelpers.parseToDateTimeUsingTimezone("2.1.2013", "3:04", "Europe/Berlin");
    expect(result.toISO()).to.equal("2013-01-02T03:04:00.000+01:00");
  });

  it("parses future time in winter", () => {
    const result = fieldHelpers.parseToDateTimeUsingTimezone("2.1.2113", "3:04", "Europe/Berlin");
    expect(result.toISO()).to.equal("2113-01-02T03:04:00.000+01:00");
  });

  it("parses past time in summer", () => {
    const result = fieldHelpers.parseToDateTimeUsingTimezone("2.8.2013", "3:04", "Europe/Berlin");
    expect(result.toISO()).to.equal("2013-08-02T03:04:00.000+02:00");
  });

  it("parses near future time in summer", () => {
    const result = fieldHelpers.parseToDateTimeUsingTimezone("2.8.2033", "3:04", "Europe/Berlin");
    expect(result.toISO()).to.equal("2033-08-02T03:04:00.000+02:00");
  });

  it("parses far future time in summer", () => {
    const result = fieldHelpers.parseToDateTimeUsingTimezone("2.8.2113", "3:04", "Europe/Berlin");
    expect(result.toISO()).to.equal("2113-08-02T03:04:00.000+02:00");
  });

  it("parses date with null time", () => {
    const result = fieldHelpers.parseToDateTimeUsingTimezone("2.8.2013", null, "Europe/Berlin");
    expect(result.toISO()).to.equal("2013-08-02T00:00:00.000+02:00");
  });

  it("parses date with undefined time", () => {
    const result = fieldHelpers.parseToDateTimeUsingTimezone("2.8.2013", undefined, "Europe/Berlin");
    expect(result.toISO()).to.equal("2013-08-02T00:00:00.000+02:00");
  });

  it("returns undefined without date", () => {
    const result = fieldHelpers.parseToDateTimeUsingTimezone(undefined, undefined, "Europe/Berlin");
    expect(result).to.be(undefined);
  });

  it("returns unix timestamps with correct offsets", () => {
    const berlinMoment = fieldHelpers.parseToDateTimeUsingTimezone("2.8.2013", "12:34", "Europe/Berlin");
    const utcMoment = fieldHelpers.parseToDateTimeUsingTimezone("2.8.2013", "12:34", "UTC");
    expect(berlinMoment.plus({ hours: 2 })).to.eql(utcMoment);
  });
});

describe("meetupDateToActivityTimes", () => {
  it("returns the start- and end date and time of an activity in readable format", () => {
    const result = fieldHelpers.meetupDateToActivityTimes("2018-08-13", "19:30", 3 * 60 * 60 * 1000);

    expect(result.startDate).to.equal("13.08.2018");
    expect(result.startTime).to.equal("19:30");
    expect(result.endDate).to.equal("13.08.2018");
    expect(result.endTime).to.equal("22:30");
  });
});

describe("formatNumberWithCurrentLocale", () => {
  it('formats for "de"', () => {
    const res = { locals: { language: "de-DE" } };
    const result = fieldHelpers.formatNumberWithCurrentLocale(res, 22);
    expect(result).to.equal("22,00");
  });

  it('formats for "en"', () => {
    const res = { locals: { language: "en-GB" } };
    const result = fieldHelpers.formatNumberWithCurrentLocale(res, 22);
    expect(result).to.equal("22.00");
  });

  it('formats "undefined"', () => {
    const res = { locals: { language: "en-GB" } };
    const result = fieldHelpers.formatNumberWithCurrentLocale(res, undefined);
    expect(result).to.equal("0.00");
  });
});

describe("containsSlash", () => {
  it("detects a leading slash", () => {
    expect(fieldHelpers.containsSlash("/lo")).to.be(true);
  });

  it("detects an inline slash", () => {
    expect(fieldHelpers.containsSlash("hal/lo")).to.be(true);
  });

  it("detects a trailing slash", () => {
    expect(fieldHelpers.containsSlash("hal/")).to.be(true);
  });

  it("detects a double slash", () => {
    expect(fieldHelpers.containsSlash("hal//")).to.be(true);
  });

  it("detects no slash", () => {
    expect(fieldHelpers.containsSlash("hallo")).to.be(false);
  });
});
