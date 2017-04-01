'use strict';

const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();
const moment = require('moment-timezone');

const beans = require('../../testutil/configureForTest').get('beans');
const memberstore = beans.get('memberstore');
const Member = beans.get('member');
const dummymember = new Member({sessionUser: {authenticationId: 'hada'}});

const mailimport = require('../../lib/mailarchive/importMails.js');

const fileWithTextAndHtml = 'test/mailarchive/testfiles/mailWithTextAndHtml';
const fileWithTextOnlyWithoutSenderName = 'test/mailarchive/testfiles/mailWithTextOnly';
const fileWithoutDate = 'test/mailarchive/testfiles/mailWithoutDate';
const fileWithReferences = 'test/mailarchive/testfiles/mailWithReferences';
const fileWithOneReference = 'test/mailarchive/testfiles/mailWithOneReference';
const fileWithInReplyTo = 'test/mailarchive/testfiles/mailWithInReplyTo';
const fileWithoutMessageId = 'test/mailarchive/testfiles/mailWithoutMessageID';

describe('Import of mails from files with mime messages', () => {
  beforeEach(() => {
    sinon.stub(memberstore, 'getMemberForEMail').callsFake((emails, callback) => {
      callback(null, dummymember);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('imports plain text from multipart message', done => {
    mailimport(fileWithTextAndHtml, 'group', (err, result) => {
      expect(err).to.equal(null);
      expect(result.text).to.contain('Plain text message 1');
      done(err);
    });
  });

  it('imports message ID from plain text message', done => {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', (err, result) => {
      expect(result.id).to.equal('message2@nomail.com');
      done(err);
    });
  });

  it('creates message ID from file content if it is missing', done => {
    mailimport(fileWithoutMessageId, 'group', (err, result) => {
      expect(result.id).to.match(/^mail-sha1-[\w]+@softwerkskammer\.org$/);
      done(err);
    });
  });

  it('imports plain text from plain text message', done => {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', (err, result) => {
      expect(result.text).to.contain('Plain text message 2');
      done(err);
    });
  });

  it('imports html from multipart message', done => {
    mailimport(fileWithTextAndHtml, 'group', (err, result) => {
      expect(result.html).to.contain('<div>Html message 1</div>');
      done(err);
    });
  });

  it('includes member id from member Service ', done => {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', (err, result) => {
      expect(result.from.id).to.equal(dummymember.id());
      done(err);
    });
  });

  it('imports sender name', done => {
    mailimport(fileWithTextAndHtml, 'group', (err, result) => {
      expect(result.from.name).to.equal('Heißen');
      done(err);
    });
  });

  it('imports sender name from address if the is not given specifically', done => {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', (err, result) => {
      expect(result.from.name).to.equal('some');
      done(err);
    });
  });

  it('imports date and time', done => {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', (err, result) => {
      expect(result.timeUnix).to.equal(moment('Mon, 25 Mar 2013 21:14:14 +0100', 'ddd, DD MMM YYYY HH:mm:ss ZZ', 'en').unix());
      done(err);
    });
  });

  it('uses current date and time if date is not available', done => {
    const beforeTestRunUnix = moment().unix() - 1;
    mailimport(fileWithoutDate, 'group', (err, result) => {
      const afterTestRunUnix = moment().unix() + 1;
      expect(result.timeUnix).to.be.gt(beforeTestRunUnix);
      expect(result.timeUnix).to.be.lt(afterTestRunUnix);
      done(err);
    });
  });
  it('assigns given group', done => {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', (err, result) => {
      expect(result.group).to.equal('group');
      done(err);
    });
  });

  it('imports subject', done => {
    mailimport(fileWithTextOnlyWithoutSenderName, 'group', (err, result) => {
      expect(result.subject).to.equal('Mail 2');
      done(err);
    });
  });

  it('imports references', done => {
    mailimport(fileWithReferences, 'group', (err, result) => {
      expect(result.references).to.eql(['message0@nomail.com', 'message1@nomail.com']);
      done(err);
    });
  });

  it('imports a single reference', done => {
    mailimport(fileWithOneReference, 'group', (err, result) => {
      expect(result.references).to.eql(['message0@nomail.com']);
      done(err);
    });
  });

  it('imports reply-to as reference if no references are available', done => {
    mailimport(fileWithInReplyTo, 'group', (err, result) => {
      expect(result.references).to.eql(['message0@nomail.com', 'message1@nomail.com']);
      done(err);
    });
  });

});
