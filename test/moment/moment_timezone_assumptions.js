"use strict";

var expect = require('chai').expect;
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
});
