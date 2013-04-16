/*global describe, it*/
"use strict";
var request = require('supertest'),
  express = require('express'),
  proxyquire = require('proxyquire'),
  conf = require('../configure')();

require('chai').should();

var authenticationModule = proxyquire('../lib/authentication', {});
var authenticationAppFactory = authenticationModule(conf);

var memberAppFactory = require('./membertest_stubs').memberModule(conf);
var appUnderTest = express();

var authenticationState = {};

function configureAuhenticatedUser(req, res, next) {
  if (authenticationState.user) {
    req.user = authenticationState.user;
  }
  next();
}

appUnderTest.configure(function () {
  appUnderTest.use(configureAuhenticatedUser);
  appUnderTest.use(authenticationAppFactory.secureByLogin);
  appUnderTest.use(memberAppFactory.newUserMustFillInRegistration);
});
appUnderTest.use('/members/', memberAppFactory.create(express()));

describe('member redirects', function () {

  it('redirects from \/members\/ users without authentication', function (done) {
    request(appUnderTest)
      .get('/members/')
      .expect('Moved Temporarily. Redirecting to /auth/login')
      .expect(302, function (err) {
        done(err);
      });
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

  it('redirects non registered users to \/members\/new', function (done) {
    authenticationState.user = {
    };
    request(appUnderTest)
      .get('/members/')
      .expect(/members\/new/)
      .expect(302, function (err) {
        delete authenticationState.user;
        done(err);
      });
  });
});

