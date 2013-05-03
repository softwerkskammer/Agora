"use strict";

var request = require('supertest');
var express = require('express');
var conf = require('./configureForTest');
var sinon = require('sinon');

var Member = conf.get('beans').get('member');
var membersAPI = conf.get('beans').get('membersAPI');
var authenticationState = {};

function configureAuhenticatedUser(req, res, next) {
  if (authenticationState.user) {
    req.user = authenticationState.user;
  }
  next();
}

var appUnderTest = express();
appUnderTest.configure(function () {
  appUnderTest.use(configureAuhenticatedUser);
  appUnderTest.use(conf.get('beans').get('secureByLogin'));
  appUnderTest.use(conf.get('beans').get('redirectRuleForNewUser'));
});
appUnderTest.use('/members/', conf.get('beans').get('membersApp')(express()));

describe('member redirects', function () {

  beforeEach(function (done) {
    sinon.stub(membersAPI, 'allMembers', function (callback) {callback(null, [new Member()]); });
    done();
  });

  afterEach(function (done) {
    membersAPI.allMembers.restore();
    done();
  });

  it('allows access to \/members\/ for registered users', function (done) {
    authenticationState.user = {
      member: true
    };
    request(appUnderTest)
      .get('/members/')
      .expect(200, function (err) {
        delete authenticationState.user;
        done(err);
      });
  });

  it('redirects from \/members\/ users without authentication', function (done) {
    request(appUnderTest)
      .get('/members/')
      .expect('Moved Temporarily. Redirecting to /auth/login')
      .expect(302, function (err) {
        done(err);
      });
  });

  it('redirects non registered users to \/members\/new', function (done) {
    authenticationState.user = {};
    request(appUnderTest)
      .get('/members/')
      .expect(/members\/new/)
      .expect(302, function (err) {
        delete authenticationState.user;
        done(err);
      });
  });
});

