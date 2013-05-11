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
      timeUnix: expectedTime.unix()
    });
    expect(mail.time.format()).to.equal(expectedTime.format());
    done();
  });

  it('uses sender name as name to be displayed if it is available', function (done) {
    var mail = new Mail({
      from: {name: "name", address: "local@domain"}
    });
    expect(mail.displayedSenderName).to.equal("name");
    done();
  });

  it('uses sender address local part as name to be displayed if the name is not available', function (done) {
    var mail = new Mail({
      from: {address: "local@domain"}
    });
    expect(mail.displayedSenderName).to.equal("local");
    done();
  });

  it('creates html from text', function (done) {
    var mail = new Mail({
      text: "<>\n<>"
    });
    expect(mail.html).to.equal("<div>\n&lt;&gt;<br>\n&lt;&gt;\n</div>");
    done();
  });

  it('contains member ID if it is available', function (done) {
    var mail = new Mail({
      from: {id: "id"}
    });
    expect(mail.memberId).to.equal("id");
    done();
  });

  it('sets member ID to null if it is notavailable', function (done) {
    var mail = new Mail({
      from: {}
    });
    expect(mail.memberId).to.equal(null);
    done();
  });
});
