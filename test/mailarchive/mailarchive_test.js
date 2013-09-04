"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();
var expect = require('chai').expect;
var moment = require('moment-timezone');

var conf = require('../configureForTest');
var parentApp = express();

var session;
parentApp.configure(function () {
  parentApp.use(function (req, res, next) {
    req.session = session;
    next();
  });
});

var app = conf.get('beans').get('mailarchiveApp')(parentApp);

var mailarchiveAPI = conf.get('beans').get('mailarchiveAPI');
var membersAPI = conf.get('beans').get('membersAPI');
var Mail = conf.get('beans').get('archivedMail');

describe('Mail content page', function () {
  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('shows "page not found" error if no message is given', function (done) {
    request(app)
      .get('/message')
      .expect(404, function (err) {
        done(err);
      });
  });

  it('shows text "Keine Mail" if mail is not found', function (done) {
    var mailForId = sinonSandbox.stub(mailarchiveAPI, 'mailForId', function (id, callback) {callback(null, undefined); });
    request(app)
      .get('/message?id=mailID')
      .expect(200)
      .expect(/Keine Mail/, function (err) {
        expect(mailForId.calledOnce).to.be.ok;
        done(err);
      });
  });

  it('shows html if message contains html', function (done) {
    var displayedMail = new Mail({
      "timeUnix": 1364242214,
      "from": {
        "name": "Heißen",
        "address": "no@mail.de"
      },
      "html": "<div>Html message 1</div>",
      "id": "<message1@nomail.com>",
      "subject": "Mail 1",
      "text": "Plain text message 1.\n",
      "group": "group"
    });

    var mailForId = sinonSandbox.stub(mailarchiveAPI, 'mailForId', function (id, callback) {callback(null, displayedMail); });
    request(app)
      .get('/message?id=mailID')
      .expect(200)
      .expect(/<div>Html message 1<\/div>/, function (err) {
        expect(mailForId.calledOnce).to.be.ok;
        done(err);
      });
  });

  it('references sender member page if available', function (done) {
    var displayedMail = new Mail({
      from: {name: "Sender Name", id: "sender ID"},
      timeUnix: 0,
      id: "<message1@nomail.com>",
      subject: "Mail 1",
      group: "group",
      text: "text"
    });
    var mailForId = sinonSandbox.stub(mailarchiveAPI, 'mailForId', function (id, callback) {callback(null, displayedMail); });

    var dummyMember = {nickname: "nickname", id: "sender ID"};
    sinonSandbox.stub(membersAPI, 'getMemberForId', function (id, callback) {
      callback(null, dummyMember);
    });

    request(app)
      .get('/message?id=mailID')
      .expect(200)
      .expect(/href="\/members\/nickname"/, function (err) {
        expect(mailForId.calledOnce).to.be.ok;
        done(err);
      });
  });

});

describe('Mail index page', function () {
  beforeEach(function (done) {
    session = {};
    sinonSandbox.stub(membersAPI, 'getMembersForIds', function (id, callback) {
      callback(null, []);
    });

    done();
  });

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  function stubMailHeaders(headers) {
    sinonSandbox.stub(mailarchiveAPI, 'mailHeaders', function (group, callback) {callback(null, headers); });
  }

  it('shows group name in the title', function (done) {
    stubMailHeaders([]);

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/<title>+group\s+mails/, function (err) {
        done(err);
      });
  });

  it('shows group name and references group page in the header', function (done) {
    stubMailHeaders([]);

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/Gruppe <a href="\/groups\/group">group<\/a>/, function (err) {
        done(err);
      });
  });

  it('contains reference to the group page', function (done) {
    stubMailHeaders([]);

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/ href="\/groups\/group"/, function (err) {
        done(err);
      });
  });

  it('shows text "Keine Mails" if no mails for group are available', function (done) {
    stubMailHeaders([]);

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/Keine Mails/, function (err) {
        done(err);
      });
  });

  var mailTime = moment("01 Jan 2010 21:14:14 +0100");
  mailTime.lang("de");
  var displayedMailHeader = new Mail({
    from: {name: "Sender Name"},
    timeUnix: mailTime.unix(),
    id: "<message1@nomail.com>",
    subject: "Mail 1",
    group: "group"
  });

  it('shows sender', function (done) {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/Sender Name/, function (err) {
        done(err);
      });
  });

  it('shows subject', function (done) {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/Mail 1/, function (err) {
        done(err);
      });
  });

  it('shows mail time', function (done) {
    stubMailHeaders([displayedMailHeader]);

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(new RegExp(mailTime.format("LLLL")), function (err) {
        done(err);
      });
  });

  it('references sender member page if available', function (done) {
    var displayedMailHeader = new Mail({
      id: "Mail 1",
      from: {name: "Sender Name", id: "sender ID"},
      subject: "Mail 1",
      group: "group"
    });
    stubMailHeaders([displayedMailHeader]);

    var dummyMember = {nickname: "nickname", id: "sender ID"};
    membersAPI.getMembersForIds.restore();
    sinonSandbox.stub(membersAPI, 'getMembersForIds', function (id, callback) {
      callback(null, [dummyMember]);
    });

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/href="\/members\/nickname"/, function (err) {
        done(err);
      });
  });

  it('references sender member page inside the thread', function (done) {
    var displayedMailHeader1 = new Mail({id: "Mail 1", subject: "Mail 1", references: [],
      group: "group"
    });
    var displayedMailHeader2 = new Mail({id: "Mail 2", subject: "Mail 2", references: ["Mail 1"],
      from: {name: "Sender Name 2", id: "sender ID"}, group: "group"
    });

    stubMailHeaders([displayedMailHeader1, displayedMailHeader2]);

    var dummyMember = {nickname: "nickname", id: "sender ID"};
    membersAPI.getMembersForIds.restore();
    sinonSandbox.stub(membersAPI, 'getMembersForIds', function (id, callback) {
      callback(null, [dummyMember]);
    });

    request(app)
      .get('/list/group?thread=true')
      .expect(200)
      .expect(/href="\/members\/nickname"/, function (err) {
        done(err);
      });
  });

  it('sorts mails unthreaded and descending on time on request', function (done) {
    var mail1 = new Mail({id: "Mail 1", subject: "Mail 1", references: [], timeUnix: 1});
    var mail2 = new Mail({id: "Mail 2", subject: "Mail 2", references: ["Mail 1"], timeUnix: 2});
    stubMailHeaders([mail1, mail2]);

    request(app)
      .get('/list/group?thread=false')
      .expect(200)
      .expect(/Mail 2[\s\S]*?Mail 1/, function (err) {
        done(err);
      });
  });

  it('sorts mails threaded and descending on time on request', function (done) {
    var mail1 = new Mail({id: "Mail 1", subject: "Mail 1", references: [], timeUnix: 1});
    var mail2 = new Mail({id: "Mail 2", subject: "Mail 2", references: ["Mail 1"], timeUnix: 2});
    stubMailHeaders([mail1, mail2]);

    request(app)
      .get('/list/group?thread=true')
      .expect(200)
      .expect(/Mail 1[\s\S]*?Mail 2/, function (err) {
        done(err);
      });
  });

  it('sets session property displayMailsThreaded to true when a threaded index is requested', function (done) {
    stubMailHeaders([]);
    request(app)
      .get('/list/group?thread=true')
      .expect(200, function (err) {
        expect(session.displayMailsThreaded).to.equal(true);
        done(err);
      });
  });

  it('sets session property displayMailsThreaded to false when a threaded index is requested', function (done) {
    stubMailHeaders([]);
    request(app)
      .get('/list/group?thread=false')
      .expect(200, function (err) {
        expect(session.displayMailsThreaded).to.equal(false);
        done(err);
      });
  });

  it('sorts mails unthreaded and descending on time by default', function (done) {
    var mail1 = new Mail({id: "Mail 1", subject: "Mail 1", references: [], timeUnix: 1});
    var mail2 = new Mail({id: "Mail 2", subject: "Mail 2", references: ["Mail 1"], timeUnix: 2});
    stubMailHeaders([mail1, mail2]);

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/Mail 2[\s\S]*?Mail 1/, function (err) {
        done(err);
      });
  });

  it('sorts mails unthreaded and descending on time on session setting', function (done) {
    var mail1 = new Mail({id: "Mail 1", subject: "Mail 1", references: [], timeUnix: 1});
    var mail2 = new Mail({id: "Mail 2", subject: "Mail 2", references: ["Mail 1"], timeUnix: 2});
    stubMailHeaders([mail1, mail2]);
    session.displayMailsThreaded = false;

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/Mail 2[\s\S]*?Mail 1/, function (err) {
        done(err);
      });
  });

  it('sorts mails threaded and descending on time on session setting', function (done) {
    var mail1 = new Mail({id: "Mail 1", subject: "Mail 1", references: [], timeUnix: 1});
    var mail2 = new Mail({id: "Mail 2", subject: "Mail 2", references: ["Mail 1"], timeUnix: 2});
    stubMailHeaders([mail1, mail2]);
    session.displayMailsThreaded = true;

    request(app)
      .get('/list/group')
      .expect(200)
      .expect(/Mail 1[\s\S]*?Mail 2/, function (err) {
        done(err);
      });
  });

  it('shows a link to not threaded representation when a threaded index is requested', function (done) {
    var mail1 = new Mail({id: "Mail 1", subject: "Mail 1", references: [], timeUnix: 1});
    stubMailHeaders([mail1]);
    request(app)
      .get('/list/group?thread=true')
      .expect(200)
      .expect(/href="group\?thread=false"/, function (err) {
        done(err);
      });
  });

  it('shows a link to threaded representation when a non threaded index is requested', function (done) {
    var mail1 = new Mail({id: "Mail 1", subject: "Mail 1", references: [], timeUnix: 1});
    stubMailHeaders([mail1]);
    request(app)
      .get('/list/group?thread=false')
      .expect(200)
      .expect(/href="group\?thread=true"/, function (err) {
        done(err);
      });
  });

});
