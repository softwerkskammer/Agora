"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;
var moment = require('moment');

var Mail = conf.get('beans').get('mail');

describe('Mail', function () {
  it('restores time from unix time', function (done) {
    var expectedTime = moment("01 Jan 2010 21:14:14 +0100");
    var mail = new Mail({
      timeUnix : expectedTime.unix()
    });
    expect(mail.time.format()).to.equal(expectedTime.format());
    done();
  });
});
