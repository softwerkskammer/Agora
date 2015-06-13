'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var csurf = require('csurf');
//var passport = require('passport');
var beans = require('../../testutil/configureForTest').get('beans');

var setupApp = require('../../testutil/testHelper');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var Member = beans.get('member');
var addCsrfTokenToLocals = beans.get('addCsrfTokenToLocals');
var serverpathRemover = beans.get('serverpathRemover');


describe('Security regarding', function () {

  describe('Clickjacking:', function () {

    beforeEach(function () {
      sinon.stub(memberstore, 'allMembers', function (callback) { callback(null, []); });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('sends an X-Frame-Options header with param DENY', function (done) {
      var app = setupApp('membersApp').createApp({middlewares: [beans.get('secureAgainstClickjacking')]});

      request(app)
        .get('/')
        .expect('X-Frame-Options', 'DENY', done);
    });

  });

  describe('Cross-Site-Request-Forgery:', function () {

    beforeEach(function () {
      var dummymember = new Member({id: 'memberId', nickname: 'hada', email: 'a@b.c', site: 'http://my.blog',
        firstname: 'Hans', lastname: 'Dampf', authentications: [], subscribedGroups: []});
      sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) { callback(null, []); });
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null, dummymember); });
      sinon.stub(memberstore, 'allMembers', function (callback) { callback(null, [dummymember]); });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('creates a CSRF token and adds it to the edit form', function (done) {
      var app = setupApp('membersApp').createApp({id: 'memberId', middlewares: [csurf()]});

      request(app)
        .get('/edit/hada')
        .expect(/input type="hidden" name="_csrf"/, done);
    });

    it('blocks updates that do not come with a csrf token', function (done) {

      // we need to load accessrights and jade support code before the csrf handling
      var app = setupApp('membersApp').createApp({id: 'memberId', middlewares: [beans.get('accessrights'), beans.get('serverpathRemover'), csurf(), addCsrfTokenToLocals]});

      request(app)
        .post('/submit')
        .send('id=memberId&firstname=A&lastname=B&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z&email=here@there.org&previousEmail=here@there.org')
        .expect(403)
        .expect(/Du hast einen Fehler gefunden\./)
        .expect(/Error: invalid csrf token/, done);
    });

    it('csrf middleware adds the csrf token to res.locals', function () {
      var csrftoken = 'csrf token';
      var req = { csrfToken: function () { return csrftoken; } };
      var res = {locals: {}};
      var next = function () { return undefined; };

      addCsrfTokenToLocals(req, res, next);

      expect(res.locals.csrf_token).to.equal(csrftoken);
    });

  });

  describe('Information disclosure', function () {
    beforeEach(function () {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, null); });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('does not happen through paths in server error messages', function (done) {

      var app = setupApp('mailsenderApp').createApp({middlewares: [serverpathRemover]});

      request(app)
        .get('/contactMember/xyz')
        .expect(500)
        // node_modules and lib are preceded by an opening paren, thus the path preceding them is cut off:
        .expect(/\(node_modules/)
        .expect(/\(softwerkskammer\/lib/)
        // we are on the right page, btw:
        .expect(/Du hast einen Fehler gefunden\./, done);

    });

//    it('does not happen through paths in authentication error messages', function (done) {
//      var app = setupApp('authenticationApp').createApp(null, passport.initialize(), passport.session(), serverpathRemover);
//
//      request(app)
//        .get('/github/callback?code=_')
//        .expect(500)
//        .expect(/\(node_modules/)
//        .expect(/ node_modules/)
//        .expect(/Problem bei der Authentifizierung/, done);
//    });

  });


});
