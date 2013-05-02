/*global describe, it*/
"use strict";
var request = require('supertest');
var express = require('express');
var proxyquire = require('proxyquire');
var conf = require('./configureForTest');
var sinon = require('sinon');
require('./configureForTest');
require('chai').should();

var Member = require('../lib/members/member');
var membersAPI = conf.get('beans').get('membersAPI');
var authenticationState = {};

function configureAuhenticatedUser(req, res, next) {
  if (authenticationState.user) {
    req.user = authenticationState.user;
  }
  next();
}

var memberAppFactory = conf.get('beans').get('membersApp');
var authenticationAppFactory = proxyquire('../lib/authentication', {});

var appUnderTest = express();
appUnderTest.configure(function () {
  appUnderTest.use(configureAuhenticatedUser);
  appUnderTest.use(authenticationAppFactory.secureByLogin);
  appUnderTest.use(memberAppFactory().newUserMustFillInRegistration);
});
appUnderTest.use('/members/', memberAppFactory().create(express()));

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

