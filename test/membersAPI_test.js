/*global describe, it */
"use strict";
var proxyquire = require('proxyquire');
var MongoConf = require('./mongoConf');
var conf = new MongoConf();

var Member = require('../lib/members/member');
var dummymember = new Member('id', 'hada');
var memberstoreStub = {
  getMember: function (nickname, callback) {
    if (new RegExp(nickname, 'i').test('hada')) {
      return callback(null, dummymember);
    }
    callback(null, null);
  }
};

var api = proxyquire('../lib/members/membersAPI', {
  './memberstore': function () {
    return memberstoreStub;
  }
})(conf);

describe('MembersAPI', function () {
  it('rejects nicknames that are reserved for URLs', function (done) {
    api.isReserved('edit').should.be.true;
    api.isReserved('eDit').should.be.true;
    api.isReserved('neW').should.be.true;
    api.isReserved('checknicKName').should.be.true;
    api.isReserved('submIt').should.be.true;
    api.isValidNickname(' checknicKName ', function (err, result) {
      result.should.be.false;
      done();
    });
  });

  it('rejects nicknames that already exist', function (done) {
    api.isValidNickname('hada', function (err, result) {
      result.should.be.false;
      done();
    });
  });

  it('accepts nicknames that do not exist', function (done) {
    api.isValidNickname('haha', function (err, result) {
      result.should.be.true;
      done();
    });
  });

  it('accepts nicknames that contain other nicknames', function (done) {
    api.isValidNickname('Schadar', function (err, result) {
      result.should.be.true;
      done();
    });
  });

  it('rejects nicknames that contain special characters', function (done) {
    api.isReserved('Sch adar').should.be.true;
    api.isReserved('Sch/adar').should.be.true;
    api.isReserved('Schadar-').should.be.true;
    api.isReserved('Schad\nar').should.be.true;
    api.isReserved('Schad@r').should.be.true;
    api.isValidNickname('Scha dar', function (err, result) {
      result.should.be.false;
      done();
    });
  });

  it('rejects nicknames that already exist, even with blanks and different case', function (done) {
    api.isValidNickname(' haDa ', function (err, result) {
      result.should.be.false;
      done();
    });
  });
});

