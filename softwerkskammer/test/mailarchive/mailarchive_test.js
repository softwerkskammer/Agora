'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var moment = require('moment-timezone');

var beans = require('../../testutil/configureForTest').get('beans');
var mailarchiveService = beans.get('mailarchiveService');
var Mail = beans.get('archivedMail');
var Member = beans.get('member');
var member = new Member({id: 'ai di', nickname: 'nigg'});

var app = require('../../testutil/testHelper')('mailarchiveApp').createApp();

describe('Mail content page', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('shows "page not found" error if no message is given', function (done) {
    request(app)
      .get('/message')
      .expect(404, function (err) {
        done(err);
      });
  });

  it('shows text "Keine E-Mails" if mail is not found', function (done) {
    var mailForId = sinon.stub(mailarchiveService, 'mailForId', function (id, callback) {callback(null, undefined); });
    request(app)
      .get('/message/mailID')
      .expect(200)
      .expect(/Keine E-Mails/, function (err) {
        expect(mailForId.calledOnce).to.be(true);
        done(err);
      });
  });

  it('shows html if message contains html', function (done) {
    var displayedMail = new Mail({
      'html': '<div>Html message 1</div>',
      'id': '<message1@nomail.com>'
    });

    var mailForId = sinon.stub(mailarchiveService, 'mailForId', function (id, callback) {callback(null, displayedMail); });
    request(app)
      .get('/message/mailID')
      .expect(200)
      .expect(/<div>Html message 1<\/div>/, function (err) {
        expect(mailForId.calledOnce).to.be(true);
        done(err);
      });
  });

  it('filters mail addresses and phone numbers from html', function (done) {
    var displayedMail = new Mail({
      'html': '<div>Html message 1: mail@somewhere.org Tel: +49 (123) 45 67 89</div>',
      'id': '<message1@nomail.com>'
    });

    var mailForId = sinon.stub(mailarchiveService, 'mailForId', function (id, callback) {callback(null, displayedMail); });
    request(app)
      .get('/message/mailID')
      .expect(200)
      .expect(/<div>Html message 1: \.\.\.@\.\.\. Tel: \.\.\.<\/div>/, function (err) {
        expect(mailForId.calledOnce).to.be(true);
        done(err);
      });
  });

  it('references sender member page if available', function (done) {
    var displayedMail = new Mail({
      id: '<message1@nomail.com>'
    });
    displayedMail.member = member;

    var mailForId = sinon.stub(mailarchiveService, 'mailForId', function (id, callback) {callback(null, displayedMail); });

    request(app)
      .get('/message/mailID')
      .expect(200)
      .expect(/href="\/members\/nigg"/, function (err) {
        expect(mailForId.calledOnce).to.be(true);
        done(err);
      });
  });

});

describe('Mail index page', function () {
  afterEach(function () {
    sinon.restore();
  });

  function stubMailHeaders(headers) {
    sinon.stub(mailarchiveService, 'threadedMails', function (group, callback) {callback(null, headers); });
    sinon.stub(mailarchiveService, 'unthreadedMails', function (group, callback) {callback(null, headers); });
  }

  it('shows group name in the title', function (done) {
    stubMailHeaders([]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/<title>\s*group\s*E-Mails/, function (err) {
        done(err);
      });
  });

  it('shows group name heading', function (done) {
    stubMailHeaders([]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/group/, function (err) {
        done(err);
      });
  });

  it('shows text "Keine E-Mails" if no mails for group are available', function (done) {
    stubMailHeaders([]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/Keine E-Mails/, function (err) {
        done(err);
      });
  });

  var mailTime = moment('01 Jan 2010 21:14:14 +0100', 'DD MMM YYYY HH:mm:ss Z');
  mailTime.locale('de');
  var displayedMailHeader = new Mail({
    from: {name: 'Sender Name'},
    timeUnix: mailTime.unix(),
    id: '<message1@nomail.com>',
    subject: 'Mail 1',
    group: 'group'
  });

  it('shows sender', function (done) {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/Sender Name/, function (err) {
        done(err);
      });
  });

  it('shows subject', function (done) {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/Mail 1/, function (err) {
        done(err);
      });
  });

  it('shows mail time', function (done) {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(new RegExp(mailTime.format('L')), function (err) {
        done(err);
      });
  });

  it('references sender member page if available', function (done) {
    displayedMailHeader = new Mail({
      id: 'Mail 1'
    });
    stubMailHeaders([displayedMailHeader]);
    displayedMailHeader.member = member;

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/href="\/members\/nigg"/, function (err) {
        done(err);
      });
  });

  it('references sender member page inside the thread', function (done) {
    var displayedMailHeader1 = new Mail(
      {id: 'Mail 1', subject: 'Mail 1', references: [], group: 'group' }
    );
    var displayedMailHeader2 = new Mail(
      {id: 'Mail 2', subject: 'Mail 2', references: ['Mail 1'], from: {name: 'Sender Name 2', id: 'sender ID'}, group: 'group' }
    );
    stubMailHeaders([displayedMailHeader1, displayedMailHeader2]);
    displayedMailHeader1.member = member;

    request(app)
      .get('/list/threaded/group')
      .expect(200)
      .expect(/href="\/members\/nigg"/, function (err) {
        done(err);
      });
  });

});
