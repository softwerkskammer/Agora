'use strict';

var expect = require('must-dist');
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var moment = require('moment-timezone');

var beans = require('../../testutil/configureForTest').get('beans');
var memberstore = beans.get('memberstore');
var Member = beans.get('member');
var dummymember = new Member({sessionUser: {authenticationId: 'hada'}});

var mailimport = require('../../lib/mailarchive/importMails.js');

var fileWithTextAndHtml = 'test/mailarchive/testfiles/mailWithTextAndHtml';
var fileWithTextOnlyWithoutSenderName = 'test/mailarchive/testfiles/mailWithTextOnly';
var fileWithoutDate = 'test/mailarchive/testfiles/mailWithoutDate';
var fileWithReferences = 'test/mailarchive/testfiles/mailWithReferences';
var fileWithInReplyTo = 'test/mailarchive/testfiles/mailWithInReplyTo';
var fileWithoutMessageId = 'test/mailarchive/testfiles/mailWithoutMessageID';

describe('Import of mails from files with mime messages', function () {
  beforeEach(function () {
    sinonSandbox.stub(memberstore, 'getMemberForEMail', function (emails, callback) {
      callback(null, dummymember);
    });
  });

  afterEach(function () {
    sinonSandbox.restore();
  });

  it('imports plain text from multipart message', function (done) {
    mailimport(fileWithTextAndHtml, 'group', function (err, result) {
      expect(err).to.equal(null);
      expect(result.text).to.contain('Plain text message 1');
      done(err);
    });
  });

  it('imports message ID from plain text message', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.id).to.equal('message2@nomail.com');
      done(err);
    });
  });

  it('creates message ID from file content if it is missing', function (done) {
    mailimport(fileWithoutMessageId, 'group', function (err, result) {
      expect(result.id).to.match(/^mail-sha1-[\w]+@softwerkskammer\.org$/);
      done(err);
    });
  });

  it('imports plain text from plain text message', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.text).to.contain('Plain text message 2');
      done(err);
    });
  });

  it('imports html from multipart message', function (done) {
    mailimport(fileWithTextAndHtml, 'group', function (err, result) {
      expect(result.html).to.contain('<div>Html message 1</div>');
      done(err);
    });
  });

  it('includes member id from member Service ', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.from.id).to.equal(dummymember.id());
      done(err);
    });
  });

  it('imports sender name', function (done) {
    mailimport(fileWithTextAndHtml, 'group', function (err, result) {
      expect(result.from.name).to.equal('Heißen');
      done(err);
    });
  });

  it('imports sender name from address if the is not given specifically', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.from.name).to.equal('some');
      done(err);
    });
  });

  it('imports date and time', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.timeUnix).to.equal(moment('Mon, 25 Mar 2013 21:14:14 +0100', 'ddd, DD MMM YYYY HH:mm:ss ZZ', 'en').unix());
      done(err);
    });
  });

  it('uses current date and time if date is not available', function (done) {
    var beforeTestRunUnix = moment().unix() - 1;
    mailimport(fileWithoutDate, 'group', function (err, result) {
      var afterTestRunUnix = moment().unix() + 1;
      expect(result.timeUnix).to.be.gt(beforeTestRunUnix);
      expect(result.timeUnix).to.be.lt(afterTestRunUnix);
      done(err);
    });
  });
  it('assigns given group', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.group).to.equal('group');
      done(err);
    });
  });

  it('imports subject', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.subject).to.equal('Mail 2');
      done(err);
    });
  });

  it('imports references', function (done) {
    mailimport(fileWithReferences, 'group', function (err, result) {
      expect(result.references).to.eql(['message0@nomail.com', 'message1@nomail.com']);
      done(err);
    });
  });

  it('imports reply-to as reference if no references are available', function (done) {
    mailimport(fileWithInReplyTo, 'group', function (err, result) {
      expect(result.references).to.eql(['message0@nomail.com']);
      done(err);
    });
  });

});
