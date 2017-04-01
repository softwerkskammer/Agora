'use strict';

const request = require('supertest');
const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const userWithoutMember = require('../../testutil/userWithoutMember');

const eventstore = beans.get('eventstore');
const GlobalEventStore = beans.get('GlobalEventStore');
const groupstore = beans.get('groupstore');
const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');

const Member = beans.get('member');
const createApp = require('../../testutil/testHelper')('socratesMailsenderApp').createApp;
const secureByLogin = beans.get('secureByLogin');
const secureSuperuserOnly = beans.get('secureSuperuserOnly');
const secureSoCraTesAdminOnly = beans.get('secureSoCraTesAdminOnly');

const transport = beans.get('mailtransport').transport;

describe('SoCraTes mailsender application', () => {
  /* eslint camelcase: 0 */

  const socratesMember = new Member({id: 'memberId'});
  const socratesAdmin = new Member({id: 'socratesAdminID'});
  const superuser = new Member({id: 'superuserID'});

  const appWithoutMember = request(createApp({
    middlewares: [userWithoutMember],
    baseurl: '/mailsender',
    secureByMiddlewares: [secureByLogin, secureSuperuserOnly, secureSoCraTesAdminOnly]
  }));
  const appWithSocratesMember = request(createApp({
    member: socratesMember,
    baseurl: '/mailsender',
    secureByMiddlewares: [secureByLogin, secureSuperuserOnly, secureSoCraTesAdminOnly]
  }));
  const appWithSocratesAdmin = request(createApp({
    member: socratesAdmin,
    baseurl: '/mailsender',
    secureByMiddlewares: [secureByLogin, secureSuperuserOnly, secureSoCraTesAdminOnly]
  }));
  const appWithSuperuser = request(createApp({
    member: superuser,
    baseurl: '/mailsender',
    secureByMiddlewares: [secureByLogin, secureSuperuserOnly, secureSoCraTesAdminOnly]
  }));

  beforeEach(() => {
    sinon.stub(transport, 'sendMail').callsFake((options, callback) => callback()); // will be called, but is OK

    sinon.stub(eventstore, 'getEventStore').callsFake((url, callback) => callback(null, new GlobalEventStore()));

    sinon.stub(groupstore, 'getGroup').callsFake((group, callback) => callback());
    sinon.stub(memberstore, 'getMembersForIds').callsFake((members, callback) => callback(null, []));
    sinon.stub(memberstore, 'getMemberForId').callsFake((memberId, callback) => callback(null, socratesMember));
    sinon.stub(memberstore, 'getMember').callsFake((member, callback) => callback(null, socratesMember));
    sinon.stub(subscriberstore, 'allSubscribers').callsFake(callback => callback(null, []));
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('mass-mailings form', () => {

    it('can be opened as superuser', done => {
      appWithSuperuser
        .get('/mailsender/massMailing')
        .expect(200, done);
    });

    it('can be opened as socrates admin', done => {
      appWithSocratesAdmin
        .get('/mailsender/massMailing')
        .expect(200, done);
    });

    it('can not be opened as regular member', done => {
      appWithSocratesMember
        .get('/mailsender/massMailing')
        .expect(302, (err, res) => {
          expect(res.header.location).to.contain('/mustBeSoCraTesAdmin'); // TODO: startWith (from 0.13.0)
          done(err);
        });
    });

    it('can not be opened when nobody is logged in', done => {
      appWithoutMember
        .get('/mailsender/massMailing')
        .expect(302)
        .expect('location', '/login', done);
    });
  });

  describe('mail form for mass mailing', () => {

    it('can be submitted as superuser', done => {
      appWithSuperuser
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('massMailing=participants')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can be submitted as socrates admin', done => {
      appWithSocratesAdmin
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('massMailing=participants')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can not be submitted as regular member', done => {
      appWithSocratesMember
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('massMailing=participants')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/registration', done);
    });

    it('can not be submitted when nobody is logged in', done => {
      appWithoutMember
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('massMailing=participants')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/login', done);
    });
  });

  describe('mail form for mail to another member', () => {

    it('can be submitted as superuser', done => {
      appWithSuperuser
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can be submitted as socrates admin', done => {
      appWithSocratesAdmin
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can be submitted as regular member', done => {
      appWithSocratesMember
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/redirectToHereIfSuccessful', done);
    });

    it('can not be submitted when nobody is logged in', done => {
      appWithoutMember
        .post('/mailsender/send')
        .send('nickname=ABC&subject=Hello&markdown=MailBody&sendCopyToSelf=true')
        .send('successURL=/redirectToHereIfSuccessful')
        .expect(302)
        .expect('location', '/login', done);
    });
  });

});
