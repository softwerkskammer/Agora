"use strict";

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var express = require('express');
var beans = require('../configureForTest').get('beans');

var setupApp = require('../testHelper');
var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var Member = beans.get('member');
var addCsrfTokenToLocals = beans.get('addCsrfTokenToLocals');


describe('Security regarding', function () {

  describe('Clickjacking:', function () {

    beforeEach(function () {
      sinon.stub(membersAPI, 'allMembers', function (callback) { callback(null, []); });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('sends an X-Frame-Options header with param DENY', function (done) {
      var app = setupApp('membersApp').createApp(null, beans.get('secureAgainstClickjacking'));

      request(app)
        .get('/')
        .expect('X-Frame-Options', 'DENY', done);
    });

  });

  describe('Cross-Site-Request-Forgery:', function () {

    beforeEach(function () {
      var dummymember = new Member({id: 'memberId', nickname: 'hada', email: 'a@b.c', site: 'http://my.blog',
        firstname: 'Hans', lastname: 'Dampf', authentications: [], subscribedGroups: []});
      sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, []); });
      sinon.stub(groupsAndMembersAPI, 'getUserWithHisGroups', function (nickname, callback) { callback(null, dummymember); });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('creates a CSRF token and adds it to the edit form', function (done) {
      var app = setupApp('membersApp').createApp('memberId', express.csrf());

      request(app)
        .get('/edit/hada')
        .expect(/input id="_csrf" type="hidden"/, done);
    });

    it('blocks updates that do not come with a csrf token', function (done) {

      var app = setupApp('membersApp').createApp('memberId', express.csrf(), addCsrfTokenToLocals);

      request(app)
        .post('/submit')
        .send('id=memberId&firstname=A&lastname=B&nickname=nuck&previousNickname=nuck&location=x&profession=y&reference=z&email=here@there.org&previousEmail=here@there.org')
        .expect(403)
        .expect(/Error: Forbidden/, done);
    });

    it('csrf middleware adds the csrf token to res.locals', function () {
      var csrf_token = "csrf token";
      var req = { csrfToken: function () { return csrf_token; } };
      var res = {locals: {}};
      var next = function () {};

      addCsrfTokenToLocals(req, res, next);

      expect(res.locals.csrf_token).to.equal(csrf_token);
    });

  });


});
