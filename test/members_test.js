/*global describe, it */
"use strict";
var request = require('supertest'),
  express = require('express'),
  sinon = require('sinon'),
  proxyquire = require('proxyquire');

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

var memberApp = proxyquire('../lib/members', {
  './membersAPI': function () {
    return membersAPIStub;
  },
  '../groupsAndMembers/groupsAndMembersAPI': groupsAndMembers,
  'connect-ensure-login': ensureLoggedInStub
});

var app = memberApp({ get: function () {
  return null; // empty config
} }).initialize(express());

describe('Members application', function () {

  it('shows the list of members as retrieved from the membersstore', function (done) {
    var allMembers = sinon.spy(membersAPIStub, 'allMembers');
    request(app)
      .get('/')
      .expect(200)
      .expect(/href="hada"/)
      .expect(/Hans Dampf/, function (err) {
        allMembers.calledOnce.should.be.ok;
        done(err);
      });
  });

  it('renders the link for single parent dir', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo')
      .expect(/href="hada"/, done);
  });

  it('renders the link for two parent dirs', function (done) {
    var root = express();
    root.use('/foo/bar', app);
    request(root)
      .get('/foo/bar')
      .expect(/href="hada"/, done);
  });

  it('renders the link for a get request with parameters', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo?param=value')
      .expect(/href="hada"/, done);
  });

  it('shows the details of one member as retrieved from the membersstore', function (done) {
    var nickname = dummymember.nickname,
      email = dummymember.email,
      getMember = sinon.spy(membersAPIStub, 'getMember'),
      getSubscribedGroupsForUser = sinon.spy(groupsAPIStub, 'getSubscribedGroupsForUser');
    request(app)
      .get('/' + nickname)
      .expect(200)
      .expect(/Blog:(.+)http:\/\/my.blog/, function (err) {
        getMember.calledWith(nickname).should.be.true;
        getSubscribedGroupsForUser.calledWith(email).should.be.true;
        done(err);
      });
  });
});
