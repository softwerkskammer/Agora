'use strict';

const expect = require('must-dist');
const R = require('ramda');
const moment = require('moment-timezone');

describe('Moment', () => {
  const jan1 = moment('2014-01-01', 'YYYY-MM-DD');
  const jan2 = moment('2014-01-02', 'YYYY-MM-DD');
  const jan3 = moment('2014-01-03', 'YYYY-MM-DD');
  const jan4 = moment('2014-01-04', 'YYYY-MM-DD');
  const jan5 = moment('2014-01-05', 'YYYY-MM-DD');

  describe('ordering:', () => {
    it('JavaScript array sort does not sort at all!', () => {
      const result = [jan3, jan5, jan1, jan2, jan4].sort();
      expect(result[0]).to.equal(jan3);
      expect(result[1]).to.equal(jan4);
      expect(result[2]).to.equal(jan5);
      expect(result[3]).to.equal(jan2);
      expect(result[4]).to.equal(jan1);
    });

    it('JavaScript array sorts with provided comparator', () => {
      const result = [jan3, jan5, jan1, jan2, jan4].sort(
        (momA, momB) => momA.valueOf() - momB.valueOf()
      );
      expect(result[0]).to.equal(jan1);
      expect(result[1]).to.equal(jan2);
      expect(result[2]).to.equal(jan3);
      expect(result[3]).to.equal(jan4);
      expect(result[4]).to.equal(jan5);
    });

    it('Ramda sortBy can sort the moments by its encapsulated date', () => {
      const result = R.sortBy(mom => mom.toDate(), [jan3, jan5, jan1, jan2, jan4]);
      expect(result[0]).to.equal(jan1);
      expect(result[1]).to.equal(jan2);
      expect(result[2]).to.equal(jan3);
      expect(result[3]).to.equal(jan4);
      expect(result[4]).to.equal(jan5);
    });

    it('Ramda sortBy can sort on the formatted value', () => {
      const result = R.sortBy(mom => mom.format(), [jan3, jan5, jan1, jan2, jan4]);
      expect(result[0]).to.equal(jan1);
      expect(result[1]).to.equal(jan2);
      expect(result[2]).to.equal(jan3);
      expect(result[3]).to.equal(jan4);
      expect(result[4]).to.equal(jan5);
    });
  });
});


