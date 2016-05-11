'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var Member = beans.get('member');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitiesService = beans.get('activitiesService');
var notifications = beans.get('notifications');
var dummymember;

var createApp = require('../../testutil/testHelper')('membersApp').createApp;
var app = createApp();

var allMembers;
var getMember;
var getSubscribedGroupsForUser;

describe('Members application', function () {

  beforeEach(function () {
    dummymember = new Member({
      id: 'memberID',
      nickname: 'hada',
      email: 'a@b.c',
      site: 'http://my.blog',
      firstname: 'Hans',
      lastname: 'Dampf',
      authentications: []
    });
    allMembers = sinon.stub(memberstore, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    getMember = sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      callback(null, dummymember);
    });
    sinon.stub(membersService, 'putAvatarIntoMemberAndSave', function (member, callback) {
      callback();
    });
    getSubscribedGroupsForUser = sinon.stub(groupsService, 'getSubscribedGroupsForUser', function (email, callback) {
      callback(null, []);
    });
    sinon.stub(activitiesService, 'getPastActivitiesOfMember', function (member, callback) {
      callback(null, []);
    });
    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) {
      callback(null, []);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('shows the list of members as retrieved from the membersstore if the user is registered', function (done) {
    request(createApp({id: 'hada'}))
      .get('/')
      .expect(200)
      .expect(/href="\/members\/hada"/)
      .expect(/Hans Dampf/, function (err) {
        expect(allMembers.calledOnce).to.be(true);
        done(err);
      });
  });

  it('shows the details of one member as retrieved from the membersstore', function (done) {
    request(createApp({id: 'hada'}))
      .get('/hada')
      .expect(200)
      .expect(/http:\/\/my\.blog/, function (err) {
        expect(getMember.calledWith(dummymember.nickname())).to.be(true);
        expect(getSubscribedGroupsForUser.calledWith(dummymember.email())).to.be(true);
        done(err);
      });
  });

  it('allows a member to edit her own data', function (done) {
    request(createApp({id: 'memberID'}))
      .get('/edit/hada')
      .expect(200)
      .expect(/Profil bearbeiten/, done);
  });

  it('does not allow a member to edit another member\'s data', function (done) {
    request(createApp({id: 'memberID1'}))
      .get('/edit/hada')
      .expect(302)
      .expect('location', /members/, done);
  });

  it('allows a superuser member to edit another member\'s data', function (done) {
    request(createApp({id: 'superuserID'}))
      .get('/edit/hada')
      .expect(200, done);
  });

  it('allows a member to edit her own avatar', function (done) {
    request(createApp({id: 'memberID'}))
      .get('/hada')
      .expect(200)
      .expect(/<img src="https:\/\/www\.gravatar\.com\/avatar\/5d60d4e28066df254d5452f92c910092\?d=mm&amp;s=200"/)
      .expect(/<input id="input-file" type="file" accept="image\/\*" name="image"\/>/, done);
  });

  it('does not allow a member to edit another member\'s avatar', function (done) {
    request(createApp({id: 'memberID1'}))
      .get('/hada')
      .expect(200)
      .expect(/<img src="https:\/\/www\.gravatar\.com\/avatar\/5d60d4e28066df254d5452f92c910092\?d=mm&amp;s=200"/, function (err, res) {
        expect(res.text).to.not.contain('<input id="input-file" type="file" accept="image\/\*" name="image"');
        done(err);
      });
  });

  it('allows a superuser member to edit another member\'s avatar', function (done) {
    request(createApp({id: 'superuserID'}))
      .get('/hada')
      .expect(200)
      .expect(/<input id="input-file" type="file" accept="image\/\*" name="image"\/>/, done);
  });

  it('allows a superuser member to add another member\'s authentication', function (done) {
    request(createApp({id: 'superuserID'}))
      .get('/edit/hada')
      .expect(200)
      .expect(/<input id="additionalAuthentication" type="text"/, done);
  });

  it('does not allow a member to add another authentication to her own profile', function (done) {
    request(createApp({id: 'memberID'}))
      .get('/edit/hada')
      .expect(200, function (err, res) {
        expect(res.text).to.not.contain('<input id="additionalAuthentication" type="text"');
        done(err);
      });
  });

  it('rejects a member with invalid and different nickname on submit', function (done) {
    sinon.stub(membersService, 'isValidNickname', function (nickname, callback) {
      callback(null, false);
    });

    request(app)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&email=c@d.de&previousEmail=c@d.de&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('previousNickname=bibabu')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Dieser Nickname ist leider nicht verfügbar\./, done);
  });

  it('rejects a member with invalid and different email address on submit', function (done) {
    sinon.stub(membersService, 'isValidEmail', function (nickname, callback) {
      callback(null, false);
    });

    request(app)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z')
      .send('email=here@there.org')
      .send('previousEmail=there@wherever.com')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Diese Adresse ist schon registriert\. Hast Du bereits ein Profil angelegt?/, done);
  });

  it('rejects a member with missing first and last name on submit', function (done) {
    request(app)
      .post('/submit')
      .send('id=0815&&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z&email=here@there.org&previousEmail=here@there.org')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Vorname ist ein Pflichtfeld\./)
      .expect(/Nachname ist ein Pflichtfeld\./, done);
  });

  it('rejects a member with missing first name who validly changed their nickname and mailaddress on submit', function (done) {
    // attention: This combination is required to prove the invocations of the callbacks in case of no error!
    sinon.stub(membersService, 'isValidNickname', function (nickname, callback) {
      callback(null, true);
    });
    sinon.stub(membersService, 'isValidEmail', function (nickname, callback) {
      callback(null, true);
    });

    request(app)
      .post('/submit')
      .send('id=0815&&nickname=nuckNew&previousNickname=nuck&lastname=x&location=x&profession=y&reference=z&email=hereNew@there.org&previousEmail=here@there.org')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Vorname ist ein Pflichtfeld\./, done);
  });

  it('rejects a member with invalid nickname and email address on submit, giving two error messages', function (done) {
    sinon.stub(membersService, 'isValidNickname', function (nickname, callback) {
      callback(null, false);
    });
    sinon.stub(membersService, 'isValidEmail', function (nickname, callback) {
      callback(null, false);
    });

    request(app)
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('previousNickname=bibabu')
      .send('email=here@there.org')
      .send('previousEmail=there@wherever.com')
      .expect(200)
      .expect(/Validierungsfehler/)
      .expect(/Dieser Nickname ist leider nicht verfügbar\./)
      .expect(/Diese Adresse ist schon registriert\. Hast Du bereits ein Profil angelegt?/, done);
  });

  it('saves an existing member and does not trigger notification sending', function (done) {
    sinon.stub(membersService, 'isValidNickname', function (nickname, callback) { callback(null, true); });
    sinon.stub(membersService, 'isValidEmail', function (nickname, callback) { callback(null, true); });
    sinon.stub(groupsAndMembersService, 'updateSubscriptions', function (member, oldEmail, subscriptions, callback) { callback(); });
    sinon.stub(memberstore, 'saveMember', function (member, callback) { callback(null); });
    var notificationCall = sinon.stub(notifications, 'newMemberRegistered', function () { return undefined; });

    // the following stub indicates that the member already exists
    sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null, dummymember); });
    request(createApp({id: 'memberID'}))
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z&country=x')
      .send('nickname=nickerinack')
      .send('email=here@there.org')
      .expect(302)
      .expect('location', /members\/nickerinack/, function (err) {
        expect(notificationCall.called).to.be(false);
        done(err);
      });
  });

  it('saves a new member and triggers notification sending', function (done) {
    sinon.stub(membersService, 'isValidNickname', function (nickname, callback) { callback(null, true); });
    sinon.stub(membersService, 'isValidEmail', function (nickname, callback) { callback(null, true); });
    sinon.stub(groupsAndMembersService, 'updateSubscriptions', function (member, oldEmail, subscriptions, callback) { callback(); });
    sinon.stub(memberstore, 'saveMember', function (member, callback) { callback(null); });
    var notificationCall = sinon.stub(notifications, 'newMemberRegistered', function () { return undefined; });

    // the following stub indicates that the member does not exist yet
    sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null); });
    request(createApp({id: 'memberID'}))
      .post('/submit')
      .send('id=0815&firstname=A&lastname=B&location=x&profession=y&reference=z')
      .send('nickname=nickerinack')
      .send('email=here@there.org')
      .expect(302)
      .expect('location', /members\/nickerinack/, function (err) {
        expect(notificationCall.called).to.be(true);
        done(err);
      });
  });

});
