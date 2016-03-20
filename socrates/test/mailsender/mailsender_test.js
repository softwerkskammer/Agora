'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');

var eventstore = beans.get('eventstore');
var GlobalEventStore = beans.get('GlobalEventStore');
var groupstore = beans.get('groupstore');
var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');

var Member = beans.get('member');
var createApp = require('../../testutil/testHelper')('socratesMailsenderApp').createApp;
var secureByLogin = beans.get('secureByLogin');
var secureSuperuserOnly = beans.get('secureSuperuserOnly');
var secureSoCraTesAdminOnly = beans.get('secureSoCraTesAdminOnly');

describe('SoCraTes mailsender application', function () {
  /* eslint camelcase: 0 */

  var socratesMember = new Member({id: 'memberId'});
  var socratesAdmin = new Member({id: 'socratesAdminID'});
  var superuser = new Member({id: 'superuserID'});

  var appWithoutMember = request(createApp({
    middlewares: [userWithoutMember],
    baseurl: '/mailsender',
    secureByMiddlewares: [secureByLogin, secureSuperuserOnly, secureSoCraTesAdminOnly]
  }));
  var appWithSocratesMember = request(createApp({
    member: socratesMember,
    baseurl: '/mailsender',
    secureByMiddlewares: [secureByLogin, secureSuperuserOnly, secureSoCraTesAdminOnly]
  }));
  var appWithSocratesAdmin = request(createApp({
    member: socratesAdmin,
    baseurl: '/mailsender',
    secureByMiddlewares: [secureByLogin, secureSuperuserOnly, secureSoCraTesAdminOnly]
  }));
  var appWithSuperuser = request(createApp({
    member: superuser,
    baseurl: '/mailsender',
    secureByMiddlewares: [secureByLogin, secureSuperuserOnly, secureSoCraTesAdminOnly]
  }));

  beforeEach(function () {
    sinon.stub(eventstore, 'getEventStore', function (url, callback) { callback(null, new GlobalEventStore()); });

    sinon.stub(groupstore, 'getGroup', function (group, callback) { callback(); });
    sinon.stub(memberstore, 'getMembersForIds', function (members, callback) { callback(null, []); });
    sinon.stub(memberstore, 'getMemberForId', function (memberId, callback) { callback(null, socratesMember); });
    sinon.stub(memberstore, 'getMember', function (member, callback) { callback(null, socratesMember); });
    sinon.stub(subscriberstore, 'allSubscribers', function (callback) { callback(null, []); });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('mass-mailings form', function () {

    it('can be opened as superuser', function (done) {
      appWithSuperuser
        .get('/mailsender/massMailing')
        .expect(200, done);
    });

    it('can be opened as socrates admin', function (done) {
      appWithSocratesAdmin
        .get('/mailsender/massMailing')
        .expect(200, done);
    });

    it('can not be opened as regular member', function (done) {
      appWithSocratesMember
        .get('/mailsender/massMailing')
        .expect(302, function (err, res) {
          expect(res.header.location).to.contain('/mustBeSoCraTesAdmin'); // TODO: startWith (from 0.13.0)
          done(err);
        });
    });

    it('can not be opened when nobody is logged in', function (done) {
      appWithoutMember
        .get('/mailsender/massMailing')
        .expect(302)
        .expect('location', '/login', done);
    });
  });

  describe('mail form for mass mailing', function () {

    it('can be submitted as superuser', function (done) {
      appWithSuperuser
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('massMailing=participants')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can be submitted as socrates admin', function (done) {
      appWithSocratesAdmin
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('massMailing=participants')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can not be submitted as regular member', function (done) {
      appWithSocratesMember
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('massMailing=participants')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/registration', done);
    });

    it('can not be submitted when nobody is logged in', function (done) {
      appWithoutMember
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('massMailing=participants')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/login', done);
    });
  });

  describe('mail form for mail to another member', function () {

    it('can be submitted as superuser', function (done) {
      appWithSuperuser
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can be submitted as socrates admin', function (done) {
      appWithSocratesAdmin
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can be submitted as regular member', function (done) {
      appWithSocratesMember
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can not be submitted when nobody is logged in', function (done) {
      appWithoutMember
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/login', done);
    });
  });

});
