/*global describe, it*/
"use strict";
var request = require('supertest'),
  express = require('express'),
  proxyquire = require('proxyquire'),
  conf = require('nconf');

require('chai').should();

var Member = require('../lib/members/member');

var dummymember = new Member();
dummymember.nickname = 'hada';
dummymember.site = 'http://my.blog';
dummymember.firstname = 'Hans';
dummymember.lastname = 'Dampf';

var groupsAPIStub = {
  getSubscribedGroupsForUser: function (email, callback) {
    callback(null, []);
  }
};

// disabling authentication
var ensureLoggedInStub = {
  ensureLoggedIn: function () {
    return function (req, res, next) {
      next();
    };
  }
};

var membersAPIStub = {
  allMembers: function (callback) {
    callback(null, [dummymember]);
  },
  getMember: function (nickname, callback) {
    callback(null, dummymember);
  }
};

var groupsAndMembers = proxyquire('../lib/groupsAndMembers/groupsAndMembersAPI', {
  '../groups/groupsAPI': function () {
    return groupsAPIStub;
  },
  '../members/membersAPI': function () {
    return membersAPIStub;
  }
});

var memberModule = proxyquire('../lib/members', {
  './membersAPI': function () {
    return membersAPIStub;
  },
  '../groupsAndMembers/groupsAndMembersAPI': groupsAndMembers,
  'connect-ensure-login': ensureLoggedInStub
});

conf.set('securedByLoginURLPattern', '/members/.*');
conf.set('publicUrlPrefix', 'publicUrlPrefix');

var authenticationModule = proxyquire('../lib/authentication', {});
var authenticationAppFactory = authenticationModule(conf);

var memberAppFactory = memberModule(conf);
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

  it('redirects non registered users', function (done) {
    authenticationState.user = {
    };
    request(appUnderTest)
      .get('/members/')
      .expect('Moved Temporarily. Redirecting to /publicUrlPrefix/members/new')
      .expect(302, function (err) {
        delete authenticationState.user;
        done(err);
      });
  });

});

