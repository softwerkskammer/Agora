'use strict';

const expect = require('must-dist');

const partnerconferences = require('../../lib/site/partnerconferences-sorted');
const partners = [
    {
      name: 'regular one day',
      url: 'http://scunconf.com/',
      startdate: '2017-07-20',
      location: 'Atlanta, GA, USA'
    },
    {
      name: 'regular two day',
      url: 'http://www.socrates-conference.de/',
      startdate: '2017-01-15',
      enddate: '2017-01-19',
      location: 'somewhere, Germany'
    },
    {
      name: 'end of month to begin of month',
      url: 'http://scunconf.com/',
      startdate: '2017-07-31',
      enddate: '2017-08-02',
      location: 'anywhere, world'
    },
    {
      name: 'end of year to begin of year',
      url: 'http://scunconf.com/',
      startdate: '2017-12-31',
      enddate: '2018-01-02',
      location: 'anywhere, world'
    }
  ]
;

describe('partnerconferences', () => {

  const sortedConfs = partnerconferences(partners);

  it('sorts the conferences by start date', () => {
    expect(sortedConfs.map(conf => conf.startMoment.format('DD-MM-YYYY'))).to.eql(['15-01-2017', '20-07-2017', '31-07-2017', '31-12-2017']);
  });

  it('formats the dates correctly', () => {
    expect(sortedConfs.map(conf => conf.datestring)).to.eql(['15 - 19 January 2017', '20 July 2017', '31 July - 2 August 2017', '31 December 2017 - 2 January 2018']);
  });

});
