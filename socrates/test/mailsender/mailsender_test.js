'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var conf = require('../../testutil/configureForTest');
var beans = conf.get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');

var activitystore = beans.get('activitystore');
var groupstore = beans.get('groupstore');
var memberstore = beans.get('memberstore');

var Member = beans.get('member');
var SoCraTesActivity = beans.get('socratesActivityExtended');
var createApp = require('../../testutil/testHelper')('socratesMailsenderApp').createApp;

describe('SoCraTes mailsender application', function () {
  /* eslint camelcase: 0 */

  var socratesMember = new Member({ id: 'memberId' });
  var socratesAdmin = new Member({ id: 'socratesAdminID' });
  var superuser = new Member({ id: 'superuserID' });

  var appWithoutMember = request(createApp({middlewares: [userWithoutMember], baseurl: '/mailsender', secureByLogin: true, secureBySuperuser: true }));
  var appWithSocratesMember = request(createApp({member: socratesMember, baseurl: '/mailsender', secureByLogin: true, secureBySuperuser: true }));
  var appWithSocratesAdmin = request(createApp({member: socratesAdmin, baseurl: '/mailsender', secureByLogin: true, secureBySuperuser: true }));
  var appWithSuperuser = request(createApp({member: superuser, baseurl: '/mailsender', secureByLogin: true, secureBySuperuser: true }));

  var socrates;
  var socratesActivity;

  beforeEach(function () {
    socrates = {
      id: 'socratesId',
      title: 'SoCraTes',
      description: 'Coolest event ever :-)',
      location: 'Right next door',
      url: 'socrates-url',
      isSoCraTes: true,
      startUnix: 1440687600,
      endUnix: 1440946800,
      owner: {nickname: 'ownerNick'},
      assignedGroup: 'assignedGroup',
      group: {groupLongName: 'longName'},
      resources: {
        single: {_canUnsubscribe: false, _limit: 0, _position: 2, _registrationOpen: true, _waitinglist: []}, // no capacity
        bed_in_double: {_canUnsubscribe: false, _limit: 10, _position: 3, _registrationOpen: false, _waitinglist: []}, // not opened
        junior: {_canUnsubscribe: false, _limit: 10, _position: 4, _registrationOpen: false}, // not opened, no waitinglist
        bed_in_junior: {_canUnsubscribe: false, _limit: 10, _position: 5, _registrationOpen: true}
      }
    };
    socratesActivity = new SoCraTesActivity(socrates);

    sinon.stub(activitystore, 'getActivity', function (activityUrl, callback) { callback(null, socratesActivity); });
    sinon.stub(groupstore, 'getGroup', function (group, callback) { callback(); });
    sinon.stub(memberstore, 'getMembersForIds', function (members, callback) { callback(null, []); });
    sinon.stub(memberstore, 'getMemberForId', function (memberId, callback) { callback(null, socratesMember); });
    sinon.stub(memberstore, 'getMember', function (member, callback) { callback(null, socratesMember); });
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
        .expect(302)
        .expect('location', '/registration', done);
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
