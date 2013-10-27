"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var moment = require('moment-timezone');

var beans = require('../configureForTest').get('beans');
var membersAPI = beans.get('membersAPI');
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
  beforeEach(function (done) {
    sinonSandbox.stub(membersAPI, 'getMemberForEMail', function (emails, callback) {
      callback(null, dummymember);
    });
    done();
  });

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('imports plain text from multipart message', function (done) {
    mailimport(fileWithTextAndHtml, 'group', function (err, result) {
      expect(err).to.equal(null);
      expect(result.text).to.contain('Plain text message 1');
      done();
    });
  });

  it('imports message ID from plain text message', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.id).to.equal('message2@nomail.com');
      done();
    });
  });

  it('creates message ID from file content if it is missing', function (done) {
    mailimport(fileWithoutMessageId, 'group', function (err, result) {
      expect(result.id).to.match(/^mail-sha1-[\w]+@softwerkskammer\.org$/);
      done();
    });
  });

  it('imports plain text from plain text message', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.text).to.contain('Plain text message 2');
      done();
    });
  });

  it('imports html from multipart message', function (done) {
    mailimport(fileWithTextAndHtml, 'group', function checkImportedObject(err, result) {
      expect(result.html).to.contain('<div>Html message 1</div>');
      done();
    });
  });

  it('includes member id from member API ', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function checkImportedObject(err, result) {
      expect(result.from.id).to.equal(dummymember.id);
      done();
    });
  });

  it('imports sender name', function (done) {
    mailimport(fileWithTextAndHtml, 'group', function checkImportedObject(err, result) {
      expect(result.from.name).to.equal('Heißen');
      done();
    });
  });

  it('imports sender name from address if the is not given specifically', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function checkImportedObject(err, result) {
      expect(result.from.name).to.equal('some');
      done();
    });
  });

  it('imports date and time', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function checkImportedObject(err, result) {
      expect(result.timeUnix).to.equal(moment('Mon, 25 Mar 2013 21:14:14 +0100').unix());
      done();
    });
  });

  it('uses current date and time if date is not available', function (done) {
    var beforeTestRunUnix = moment().unix() - 1;
    mailimport(fileWithoutDate, 'group', function checkImportedObject(err, result) {
      var afterTestRunUnix = moment().unix() + 1;
      expect(result.timeUnix).to.be.greaterThan(beforeTestRunUnix);
      expect(result.timeUnix).to.be.lessThan(afterTestRunUnix);
      done();
    });
  });
  it('assigns given group', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.group).to.equal('group');
      done();
    });
  });

  it('imports subject', function (done) {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', function (err, result) {
      expect(result.subject).to.equal('Mail 2');
      done();
    });
  });

  it('imports references', function (done) {
    mailimport(fileWithReferences, 'group', function (err, result) {
      expect(result.references).to.deep.equal(["message0@nomail.com", "message1@nomail.com"]);
      done();
    });
  });

  it('imports reply-to as reference if no references are available', function (done) {
    mailimport(fileWithInReplyTo, 'group', function (err, result) {
      expect(result.references).to.deep.equal(["message0@nomail.com"]);
      done();
    });
  });

});
