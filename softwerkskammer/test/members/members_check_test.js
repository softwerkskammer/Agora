'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');

var Member = beans.get('member');
var memberstore = beans.get('memberstore');

var app = require('../../testutil/testHelper')('membersApp').createApp();

describe('Members application checks', function () {

  afterEach(function () {
    sinon.restore();
  });

  describe('for email', function () {
    it('validates a duplicate email address via ajax - email is same as previous', function (done) {
      request(app)
        .get('/checkemail?email=my.mail@yourmail.de&previousEmail=my.mail@yourmail.de')
        .expect(200)
        .expect('true', done);
    });

    it('validates a duplicate email address via ajax - email is not taken and different to previous', function (done) {
      sinon.stub(memberstore, 'getMemberForEMail', function (email, callback) {
        callback(null, null);
      });
      request(app)
        .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
        .expect(200)
        .expect('true', done);
    });

    it('validates a duplicate email address via ajax - email is taken and different to previous', function (done) {
      sinon.stub(memberstore, 'getMemberForEMail', function (email, callback) {
        callback(null, new Member());
      });
      request(app)
        .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
        .expect(200)
        .expect('false', done);
    });

    it('validates a duplicate email address via ajax - email query yields and error and email is different to previous', function (done) {
      sinon.stub(memberstore, 'getMemberForEMail', function (email, callback) {
        callback(new Error());
      });
      request(app)
        .get('/checkemail?email=other@x.de&previousEmail=my.mail@yourmail.de')
        .expect(200)
        .expect('false', done);
    });
  });

  describe('for nickname', function () {
    it('validates a duplicate nickname via ajax - nickname is same as previous', function (done) {
      request(app)
        .get('/checknickname?nickname=nickerinack&previousNickname=nickerinack')
        .expect(200)
        .expect('true', done);
    });

    it('validates a duplicate nickname via ajax - nickname is not taken and different to previous', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) {
        callback(null, null);
      });
      request(app)
        .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
        .expect(200)
        .expect('true', done);
    });

    it('validates a duplicate nickname via ajax - nickname is taken and different to previous', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) {
        callback(null, new Member());
      });
      request(app)
        .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
        .expect(200)
        .expect('false', done);
    });

    it('validates a duplicate nickname via ajax - nickname query yields and error and email is different to previous', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) {
        callback(new Error());
      });
      request(app)
        .get('/checknickname?nickname=nickerinack&previousNickname=bibabu')
        .expect(200)
        .expect('false', done);
    });
  });

});
