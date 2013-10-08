"use strict";

var request = require('supertest');
var express = require('express');
var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');
var Member = beans.get('member');
var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var dummymember = new Member({nickname: 'hada', email: 'a@b.c', site: 'http://my.blog', firstname: 'Hans', lastname: 'Dampf'});

var app = beans.get('membersApp')(express());

var allMembers;
var getMember;
var getSubscribedGroupsForUser;

describe('Members application', function () {

  beforeEach(function (done) {
    allMembers = sinon.stub(membersAPI, 'allMembers', function (callback) {
      callback(null, [dummymember]);
    });
    getMember = sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      callback(null, dummymember);
    });
    getSubscribedGroupsForUser = sinon.stub(groupsAPI, 'getSubscribedGroupsForUser', function (email, callback) {
      callback(null, []);
    });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('shows the list of members as retrieved from the membersstore', function (done) {
    request(app)
      .get('/')
      .expect(200)
      .expect(/href="\/members\/hada"/)
      .expect(/Hans Dampf/, function (err) {
        expect(allMembers.calledOnce).to.be.ok;
        done(err);
      });
  });

  it('renders the link for single parent dir', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo')
      .expect(/href="\/members\/hada"/, done);
  });

  it('renders the link for two parent dirs', function (done) {
    var root = express();
    root.use('/foo/bar', app);
    request(root)
      .get('/foo/bar')
      .expect(/href="\/members\/hada"/, done);
  });

  it('renders the link for a get request with parameters', function (done) {
    var root = express();
    root.use('/foo', app);
    request(root)
      .get('/foo?param=value')
      .expect(/href="\/members\/hada"/, done);
  });

  it('shows the details of one member as retrieved from the membersstore', function (done) {
    request(app)
      .get('/hada')
      .expect(200)
      .expect(/Blog:(.+)http:\/\/my.blog/, function (err) {
        expect(getMember.calledWith(dummymember.nickname)).to.be.true;
        expect(getSubscribedGroupsForUser.calledWith(dummymember.email)).to.be.true;
        done(err);
      });
  });

  it('validates a duplicate email address via ajax - email is same as previous', function (done) {
    request(app)
      .get('/checkemail?email=my.mail@yourmail.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('true', function (err) {
        done(err);
      });
  });

  it('validates a duplicate email address via ajax - email is valid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(null, true);
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('true', function (err) {
        done(err);
      });
  });

  it('validates a duplicate email address via ajax - email is invalid and different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(null, false);
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('false', function (err) {
        done(err);
      });
  });

  it('validates a duplicate email address via ajax - email query yields and error and email is different to previous', function (done) {
    sinon.stub(membersAPI, 'isValidEmail', function (mail, callback) {
      callback(new Error());
    });
    request(app)
      .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
      .expect(200)
      .expect('false', function (err) {
        done(err);
      });
  });
});
