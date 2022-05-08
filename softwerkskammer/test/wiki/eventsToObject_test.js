"use strict";

const expect = require("must-dist");
require("../../testutil/configureForTest").get("beans");
const eventsToObject = require("../../lib/wiki/eventsToObject");

describe("Wiki EventsToObject", () => {
  const eventsWithOOP = [
    {
      start: "2015-02-01T00:00:00.000Z",
      end: "2015-02-05T22:00:00.000Z",
      url: "http://www.oop-konferenz.de/",
      title: "OOP (München)",
      color: "#999",
    },
  ];

  describe("parses multiline text", () => {
    const oop = "[OOP](http://www.oop-konferenz.de/) | München  | 1.2. - 5.2.";
    const microXchg = "[microXchg - The Microservices Conference](http://microxchg.io) | Berlin | 4.2. - 5.2. ";

    it("seperated by LF", () => {
      const text = oop + "\n" + microXchg;
      expect(eventsToObject(text, 2015)).to.have.length(2);
    });

    it("seperated by CR", () => {
      const text = oop + "\r" + microXchg;
      expect(eventsToObject(text, 2015)).to.have.length(2);
    });

    it("seperated by CRLF", () => {
      const text = oop + "\r\n" + microXchg;
      expect(eventsToObject(text, 2015)).to.have.length(2);
    });

    it("ignoring meaningless lines", () => {
      const text = oop + "\n" + "some text | even | in table" + "\n" + microXchg;
      expect(eventsToObject(text, 2015)).to.have.length(2);
    });
  });

  describe('parses lines with "columns" ("|")', () => {
    it('having three "columns"', () => {
      const text = "[OOP](http://www.oop-konferenz.de/) | München  | 1.2. - 5.2.";
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('less than three "columns" are ignored', () => {
      const text = "[OOP](http://www.oop-konferenz.de/) München  | 1.2. - 5.2.";
      expect(eventsToObject(text, 2015)).to.be.empty();
    });

    it('more than three "columns" are ignored', () => {
      const text = "[OOP](http://www.oop-konferenz.de/) | | München  | 1.2. - 5.2.";
      expect(eventsToObject(text, 2015)).to.be.empty();
    });
  });

  describe("parses title and url", () => {
    it('ignoring leading and trailing spaces around the "column"', () => {
      const text = "   [OOP](http://www.oop-konferenz.de/)    | München  | 1.2. - 5.2.";
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it("ignoring leading and trailing spaces inside", () => {
      const text = "[   OOP   ]( http://www.oop-konferenz.de/ )| München  | 1.2. - 5.2.";
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('ignores wrongly formatted first "column"', () => {
      const text = "http://www.oop-konferenz.de/| München  | 1.2. - 5.2.";
      expect(eventsToObject(text, 2015)).to.be.empty();
    });
  });

  describe("parses start and end", () => {
    const startString = "2015-02-01T00:00:00.000Z";
    const endString = "2015-02-01T22:00:00.000Z";

    it("when present", () => {
      const text = "[OOP](http://www.oop-konferenz.de/) | München  | 1.2. - 5.2.";
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('ignoring leading and trailing spaces around the "column"', () => {
      const text = "   [OOP](http://www.oop-konferenz.de/)    | München  |   1.2. - 5.2.   ";
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it("ignoring missing leading and trailing spaces inside", () => {
      const text = "[   OOP   ]( http://www.oop-konferenz.de/ )| München  |1.2.-5.2.";
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('ignoring missing "to" date then replacing it with from (+1 day)', () => {
      const text = "[   OOP   ]( http://www.oop-konferenz.de/ )| München  | 1.2.";
      expect(eventsToObject(text, 2015)[0].start).to.be(startString);
      expect(eventsToObject(text, 2015)[0].end).to.be(endString);
    });

    it('ignoring missing "to" date (but " - ") then replacing it with from (+1 day)', () => {
      const text = "[   OOP   ]( http://www.oop-konferenz.de/ )| München  | 1.2. - ";
      expect(eventsToObject(text, 2015)[0].start).to.be(startString);
      expect(eventsToObject(text, 2015)[0].end).to.be(endString);
    });

    it('ignores wrongly formatted last "column"', () => {
      const text = "http://www.oop-konferenz.de/| München  | 44.33.";
      expect(eventsToObject(text, 2015)).to.be.empty();
    });
  });
});
