'use strict';

const expect = require('must-dist');
const moment = require('moment-timezone');

describe('moment-timezone', () => {

  it('returns same unix timestamp whether in utc mode or not', () => {
    const now = moment();
    const utcMoment = now.clone().utc();
    const localMoment = now.clone().utcOffset(-120);

    expect(utcMoment.format()).to.not.equal(localMoment.format());
    expect(utcMoment.unix()).to.equal(localMoment.unix());
  });

  it('returns same unix timestamp for same instant in different timezones', () => {
    const unixTimestamp = 1234567890;
    const utcMoment = moment.unix(unixTimestamp).utc();
    const berlinMoment = moment.unix(unixTimestamp).tz('Europe/Berlin');

    expect(utcMoment.format()).to.not.equal(berlinMoment.format());
    expect(utcMoment.unix()).to.equal(berlinMoment.unix());
  });

  it('does not shift the time when switching from winter to summer anymore', () => {
    const result = moment.tz('2013-11-30 23:30', 'Europe/Berlin');
    result.month(7); // set to August (!)
    expect(result.format(), 'Resulting date is 30th').to.equal('2013-08-30T23:30:00+02:00');
  });

  it('does not shift the month after setting the month anymore', () => {
    const result = moment.tz('2013-01-31 23:30', 'Europe/Berlin');
    result.month(7); // set to August (!)
    expect(result.format(), 'Resulting month is August').to.equal('2013-08-31T23:30:00+02:00');
  });

});
