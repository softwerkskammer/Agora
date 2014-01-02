"use strict";

var expect = require('chai').expect;
var moment = require('moment-timezone');

describe('timezone', function () {

  it('shifts the time (and thus possibly the date) when switching from winter to summer', function () {
    var result = moment.utc('30.11.2013 23:30', 'D.M.YYYY H:m').tz('Europe/Berlin');
    result.month(7); // set to August (!)
    expect(result.format(), "Resulting date is 31st, not 30th!").to.equal('2013-08-31T00:30:00+02:00');
  });

  it('time shift is especially nasty when it shifts the month after setting the month', function () {
    var result = moment.utc('31.1.2013 23:30', 'D.M.YYYY H:m').tz('Europe/Berlin');
    result.month(7); // set to August (!)
    expect(result.format(), "Resulting month is September, not August!").to.equal('2013-09-01T00:30:00+02:00');
  });

});
