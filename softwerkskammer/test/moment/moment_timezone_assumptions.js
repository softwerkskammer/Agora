'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');

describe('moment-timezone', function () {

  it('returns same unix timestamp whether in utc mode or not', function () {
    var now = moment();
    var utcMoment = now.clone().utc();
    var localMoment = now.clone().utcOffset(-120);

    expect(utcMoment.format()).to.not.equal(localMoment.format());
    expect(utcMoment.unix()).to.equal(localMoment.unix());
  });

  it('returns same unix timestamp for same instant in different timezones', function () {
    var unixTimestamp = 1234567890;
    var utcMoment = moment.unix(unixTimestamp).utc();
    var berlinMoment = moment.unix(unixTimestamp).tz('Europe/Berlin');

    expect(utcMoment.format()).to.not.equal(berlinMoment.format());
    expect(utcMoment.unix()).to.equal(berlinMoment.unix());
  });

  it('does not shift the time when switching from winter to summer anymore', function () {
    var result = moment.tz('2013-11-30 23:30', 'Europe/Berlin');
    result.month(7); // set to August (!)
    expect(result.format(), 'Resulting date is 30th').to.equal('2013-08-30T23:30:00+02:00');
  });

  it('does not shift the month after setting the month anymore', function () {
    var result = moment.tz('2013-01-31 23:30', 'Europe/Berlin');
    result.month(7); // set to August (!)
    expect(result.format(), 'Resulting month is August').to.equal('2013-08-31T23:30:00+02:00');
  });

});
