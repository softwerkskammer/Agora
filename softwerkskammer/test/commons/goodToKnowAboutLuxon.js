"use strict";

const expect = require("must-dist");
const R = require("ramda");
const { DateTime } = require("luxon");

describe("Luxon", () => {
  const jan1 = DateTime.fromFormat("2014-01-01", "yyyy-MM-dd");
  const jan2 = jan1.plus({ days: 1 });
  const jan3 = jan2.plus({ days: 1 });
  const jan4 = jan3.plus({ days: 1 });
  const jan5 = jan4.plus({ days: 1 });

  describe("ordering:", () => {
    it("JavaScript array sorts!", () => {
      const result = [jan3, jan5, jan1, jan2, jan4].sort();
      expect(result[0]).to.equal(jan1);
      expect(result[1]).to.equal(jan2);
      expect(result[2]).to.equal(jan3);
      expect(result[3]).to.equal(jan4);
      expect(result[4]).to.equal(jan5);
    });

    it("JavaScript array sorts with provided comparator", () => {
      const result = [jan3, jan5, jan1, jan2, jan4].sort((momA, momB) => momA.valueOf() - momB.valueOf());
      expect(result[0]).to.equal(jan1);
      expect(result[1]).to.equal(jan2);
      expect(result[2]).to.equal(jan3);
      expect(result[3]).to.equal(jan4);
      expect(result[4]).to.equal(jan5);
    });

    it("Ramda sortBy can sort the moments by its encapsulated date", () => {
      const result = R.sortBy((mom) => mom.toJSDate(), [jan3, jan5, jan1, jan2, jan4]);
      expect(result[0]).to.equal(jan1);
      expect(result[1]).to.equal(jan2);
      expect(result[2]).to.equal(jan3);
      expect(result[3]).to.equal(jan4);
      expect(result[4]).to.equal(jan5);
    });

    it("Ramda sortBy can sort on the formatted value", () => {
      const result = R.sortBy((mom) => mom.toISO(), [jan3, jan5, jan1, jan2, jan4]);
      expect(result[0]).to.equal(jan1);
      expect(result[1]).to.equal(jan2);
      expect(result[2]).to.equal(jan3);
      expect(result[3]).to.equal(jan4);
      expect(result[4]).to.equal(jan5);
    });
  });
});
