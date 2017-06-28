'use strict';

const expect = require('must-dist');

const partnerconferences = require('../../lib/site/partnerconferences-sorted');
const partners = require('./partnersForTest.json');

describe('partnerconferences', () => {

  const sortedConfs = partnerconferences(partners);

  it('sorts the conferences by start date', () => {
    expect(sortedConfs.map(conf => conf.startMoment.format('DD-MM-YYYY'))).to.eql(['15-01-2017', '20-07-2017', '31-07-2017', '31-12-2017']);
  });

  it('formats the dates correctly', () => {
    expect(sortedConfs.map(conf => conf.datestring)).to.eql(['15 - 19 January 2017', '20 July 2017', '31 July - 2 August 2017', '31 December 2017 - 2 January 2018']);
  });

});
