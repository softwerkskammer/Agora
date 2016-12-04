'use strict';

const request = require('supertest');
const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');
const moment = require('moment-timezone');

const beans = require('../../testutil/configureForTest').get('beans');
const mailarchiveService = beans.get('mailarchiveService');
const Mail = beans.get('archivedMail');
const Member = beans.get('member');
const member = new Member({id: 'ai di', nickname: 'nigg'});

const app = require('../../testutil/testHelper')('mailarchiveApp').createApp();

describe('Mail content page', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('shows "page not found" error if no message is given', done => {
    request(app)
      .get('/message')
      .expect(404, err => {
        done(err);
      });
  });

  it('shows text "Keine E-Mails" if mail is not found', done => {
    const mailForId = sinon.stub(mailarchiveService, 'mailForId', (id, callback) => {callback(null, undefined); });
    request(app)
      .get('/message/mailID')
      .expect(200)
      .expect(/Keine E-Mails/, err => {
        expect(mailForId.calledOnce).to.be(true);
        done(err);
      });
  });

  it('shows html if message contains html', done => {
    const displayedMail = new Mail({
      'html': '<div>Html message 1</div>',
      'id': '<message1@nomail.com>'
    });

    const mailForId = sinon.stub(mailarchiveService, 'mailForId', (id, callback) => {callback(null, displayedMail); });
    request(app)
      .get('/message/mailID')
      .expect(200)
      .expect(/<div>Html message 1<\/div>/, err => {
        expect(mailForId.calledOnce).to.be(true);
        done(err);
      });
  });

  it('filters mail addresses and phone numbers from html', done => {
    const displayedMail = new Mail({
      'html': '<div>Html message 1: mail@somewhere.org Tel: +49 (123) 45 67 89</div>',
      'id': '<message1@nomail.com>'
    });

    const mailForId = sinon.stub(mailarchiveService, 'mailForId', (id, callback) => {callback(null, displayedMail); });
    request(app)
      .get('/message/mailID')
      .expect(200)
      .expect(/<div>Html message 1: \.\.\.@\.\.\. Tel: \.\.\.<\/div>/, err => {
        expect(mailForId.calledOnce).to.be(true);
        done(err);
      });
  });

  it('references sender member page if available', done => {
    const displayedMail = new Mail({
      id: '<message1@nomail.com>'
    });
    displayedMail.member = member;

    const mailForId = sinon.stub(mailarchiveService, 'mailForId', (id, callback) => {callback(null, displayedMail); });

    request(app)
      .get('/message/mailID')
      .expect(200)
      .expect(/href="\/members\/nigg"/, err => {
        expect(mailForId.calledOnce).to.be(true);
        done(err);
      });
  });

});

describe('Mail index page', () => {
  afterEach(() => {
    sinon.restore();
  });

  function stubMailHeaders(headers) {
    sinon.stub(mailarchiveService, 'threadedMails', (group, callback) => {callback(null, headers); });
    sinon.stub(mailarchiveService, 'unthreadedMails', (group, callback) => {callback(null, headers); });
  }

  it('shows group name in the title', done => {
    stubMailHeaders([]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/<title>\s*group\s*E-Mails/, err => {
        done(err);
      });
  });

  it('shows group name heading', done => {
    stubMailHeaders([]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/group/, err => {
        done(err);
      });
  });

  it('shows text "Keine E-Mails" if no mails for group are available', done => {
    stubMailHeaders([]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/Keine E-Mails/, err => {
        done(err);
      });
  });

  const mailTime = moment('01 Jan 2010 21:14:14 +0100', 'DD MMM YYYY HH:mm:ss Z');
  mailTime.locale('de');
  let displayedMailHeader = new Mail({
    from: {name: 'Sender Name'},
    timeUnix: mailTime.unix(),
    id: '<message1@nomail.com>',
    subject: 'Mail 1',
    group: 'group'
  });

  it('shows sender', done => {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/Sender Name/, err => {
        done(err);
      });
  });

  it('shows subject', done => {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/Mail 1/, err => {
        done(err);
      });
  });

  it('shows mail time', done => {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(new RegExp(mailTime.format('L')), err => {
        done(err);
      });
  });

  it('references sender member page if available', done => {
    displayedMailHeader = new Mail({
      id: 'Mail 1'
    });
    stubMailHeaders([displayedMailHeader]);
    displayedMailHeader.member = member;

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/href="\/members\/nigg"/, err => {
        done(err);
      });
  });

  it('references sender member page inside the thread', done => {
    const displayedMailHeader1 = new Mail(
      {id: 'Mail 1', subject: 'Mail 1', references: [], group: 'group'}
    );
    const displayedMailHeader2 = new Mail(
      {id: 'Mail 2', subject: 'Mail 2', references: ['Mail 1'], from: {name: 'Sender Name 2', id: 'sender ID'}, group: 'group'}
    );
    stubMailHeaders([displayedMailHeader1, displayedMailHeader2]);
    displayedMailHeader1.member = member;

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/href="\/members\/nigg"/, err => {
        done(err);
      });
  });

});
