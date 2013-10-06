"use strict";

require('../configureForTest');
var expect = require('chai').expect;
var moment = require('moment-timezone');

var beans = require('nconf').get('beans');
var Mail = beans.get('archivedMail');
var Member = beans.get('member');

describe('Mail', function () {

  var member = new Member({
    id: 'member',
    nickname: 'member',
    firstname: 'Hans',
    lastname: 'Becker'
  });

  var mailWithFrom = new Mail({
    id: 'Mail 1',
    from: {name: 'name', address: 'local@domain'}
  });

  it('throws an error if given object has no valid id', function () {
    function newMail() { new Mail({}); }

    expect(newMail).to.throw(Error, /message has no valid id/);
  });

  it('restores time from unix time', function () {
    var expectedTime = moment('01 Jan 2010 21:14:14 +0100');
    var mail = new Mail({
      id: 'Mail 1',
      timeUnix: expectedTime.unix()
    });
    expect(mail.time.format()).to.equal(expectedTime.format());
  });

  it('uses sender name as name to be displayed if it is available', function (done) {
    expect(mailWithFrom.displayedSenderName()).to.equal('name');
    done();
  });

  it('uses the display name of a real member if available', function () {
    mailWithFrom.member = member;
    expect(mailWithFrom.displayedSenderName()).to.equal('Hans Becker');
    delete mailWithFrom.member;
  });

  it('has a nickname of "null" if no member', function () {
    expect(mailWithFrom.memberNickname()).to.be.null;
  });

  it('uses the nickname of a real member if available', function () {
    mailWithFrom.member = member;
    expect(mailWithFrom.memberNickname()).to.equal('member');
    delete mailWithFrom.member;
  });

  it('creates html from text', function () {
    var mail = new Mail({
      id: 'Mail 1',
      text: '<>\n<>'
    });
    expect(mail.getHtml()).to.equal('<div>\n&lt;&gt;<br>\n&lt;&gt;\n</div>');
  });

  it('contains member ID if it is available', function () {
    var mail = new Mail({
      id: 'Mail 1',
      from: {id: 'id'}
    });
    expect(mail.memberId()).to.equal('id');
  });

  it('sets member ID to null if it is not available', function () {
    var mail = new Mail({
      id: "Mail 1"
    });
    expect(mail.memberId()).to.equal(null);
  });

  it('sorts responses ascending', function () {
    var mail = new Mail({
      id: 'Mail 1'
    });
    mail.responses = [
      {timeUnix: 3},
      {timeUnix: 2},
      {timeUnix: 1}
    ];

    expect(mail.sortedResponses()).to.deep.equal([
      {timeUnix: 1},
      {timeUnix: 2},
      {timeUnix: 3}
    ]);
  });
});
