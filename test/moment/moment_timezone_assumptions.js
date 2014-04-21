"use strict";

var expect = require('must');
var moment = require('moment-timezone');

describe('moment-timezone', function () {

  it('returns same unix timestamp whether in utc mode or not', function () {
    var now = moment();
    var utcMoment = now.clone().utc();
    var localMoment = now.clone().zone(-120);

    expect(utcMoment.format()).to.not.equal(localMoment.format());
    expect(utcMoment.unix()).to.equal(localMoment.unix());
  });

  it('returns same unix timestamp for same instant in different timezones', function () {
    var unixTimestamp = 1234567890;
    var utcMoment = moment.unix(unixTimestamp).utc();
    var berlinMoment = moment.unix(unixTimestamp).tz("Europe/Berlin");

    expect(utcMoment.format()).to.not.equal(berlinMoment.format());
    expect(utcMoment.unix()).to.equal(berlinMoment.unix());
  });

  it('shifts the time (and thus possibly the date) when switching from winter to summer', function () {
    var result = moment.tz('2013-11-30 23:30', 'Europe/Berlin');
    result.month(7); // set to August (!)
    expect(result.format(), "Resulting date is 31st, not 30th!").to.equal('2013-08-31T00:30:00+02:00');
  });

  it('time shift is especially nasty when it shifts the month after setting the month', function () {
    var result = moment.tz('2013-01-31 23:30', 'Europe/Berlin');
    result.month(7); // set to August (!)
    expect(result.format(), "Resulting month is September, not August!").to.equal('2013-09-01T00:30:00+02:00');
  });

});
