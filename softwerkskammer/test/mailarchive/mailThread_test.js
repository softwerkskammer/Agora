'use strict';

const beans = require('../../testutil/configureForTest').get('beans');
const expect = require('must-dist');

const mailThread = beans.get('mailThread');
const Mail = beans.get('archivedMail');

describe('mail thread builder', () => {
  it('returns empty array given an empty array', () => {
    const threadedMails = mailThread([]);
    expect(threadedMails).to.eql([]);
  });

  it('returns single mail given a single mail', () => {
    const mail1 = new Mail({id: 'Mail 1'});
    const threadedMails = mailThread([mail1]);
    expect(threadedMails).to.eql([mail1]);
  });

  it('builds a thread from two related mails', () => {
    const mail1 = new Mail({id: 'Mail 1'});
    const mail2 = new Mail({id: 'Mail 2', references: ['Mail 1']});
    const threadedMails = mailThread([mail1, mail2]);
    mail1.responses = [mail2];
    expect(threadedMails).to.eql([mail1]);
  });

  it('recognizes mail with references to not existing mail ids only as not a thread root', () => {
    const mail2 = new Mail({id: 'Mail 2', references: ['Mail 1']});
    const threadedMails = mailThread([mail2]);
    expect(threadedMails).to.eql([mail2]);
  });

  it('adds thread modification time to leaf mails', () => {
    const mail1 = new Mail({id: 'Mail 1', timeUnix: 1});
    mailThread([mail1]);
    expect(mail1.youngestResponse()).to.equal(mail1);
  });

  it('adds thread modification time to parent mails', () => {
    const mail1 = new Mail({id: 'Mail 1', timeUnix: 1});
    const mail2 = new Mail({id: 'Mail 2', timeUnix: 2, references: ['Mail 1']});
    const mail3 = new Mail({id: 'Mail 3', timeUnix: 3, references: ['Mail 1']});
    mailThread([mail1, mail2, mail3]);
    expect(mail1.youngestResponse()).to.equal(mail3);
  });

});
