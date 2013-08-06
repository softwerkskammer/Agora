"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;
var moment = require('moment-timezone');

var Mail = conf.get('beans').get('archivedMail');

describe('Mail', function () {
  it('throws an error if given object has no valid id', function () {
    function newMail() { new Mail({}); }
    expect(newMail).to.throw(Error, /message has no valid id/);
  });

  it('restores time from unix time', function (done) {
    var expectedTime = moment("01 Jan 2010 21:14:14 +0100");
    var mail = new Mail({
      id: "Mail 1",
      timeUnix: expectedTime.unix()
    });
    expect(mail.time.format()).to.equal(expectedTime.format());
    done();
  });

  it('uses sender name as name to be displayed if it is available', function (done) {
    var mail = new Mail({
      id: "Mail 1",
      from: {name: "name", address: "local@domain"}
    });
    expect(mail.displayedSenderName).to.equal("name");
    done();
  });

  it('creates html from text', function (done) {
    var mail = new Mail({
      id: "Mail 1",
      text: "<>\n<>"
    });
    expect(mail.html).to.equal("<div>\n&lt;&gt;<br>\n&lt;&gt;\n</div>");
    done();
  });

  it('contains member ID if it is available', function (done) {
    var mail = new Mail({
      id: "Mail 1",
      from: {id: "id"}
    });
    expect(mail.memberId).to.equal("id");
    done();
  });

  it('sets member ID to null if it is notavailable', function (done) {
    var mail = new Mail({
      id: "Mail 1",
      from: {}
    });
    expect(mail.memberId).to.equal(null);
    done();
  });
});
