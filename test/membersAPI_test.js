/*global describe, it */
"use strict";
var proxyquire = require('proxyquire');
var MongoConf = require('./mongoConf');
var conf = new MongoConf();
var expect = require('chai').expect;

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
    expect(api.isReserved('edit')).to.be.true;
    expect(api.isReserved('eDit')).to.be.true;
    expect(api.isReserved('neW')).to.be.true;
    expect(api.isReserved('checknicKName')).to.be.true;
    expect(api.isReserved('submIt')).to.be.true;
    api.isValidNickname(' checknicKName ', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });

  it('rejects nicknames that already exist', function (done) {
    api.isValidNickname('hada', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });

  it('accepts nicknames that do not exist', function (done) {
    api.isValidNickname('haha', function (err, result) {
      expect(result).to.be.true;
      done();
    });
  });

  it('accepts nicknames that contain other nicknames', function (done) {
    api.isValidNickname('Schadar', function (err, result) {
      expect(result).to.be.true;
      done();
    });
  });

  it('rejects nicknames that contain special characters', function (done) {
    expect(api.isReserved('Sch adar')).to.be.true;
    expect(api.isReserved('Sch/adar')).to.be.true;
    expect(api.isReserved('Schadar-')).to.be.true;
    expect(api.isReserved('Schad\nar')).to.be.true;
    expect(api.isReserved('Schad@r')).to.be.true;
    api.isValidNickname('Scha dar', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });

  it('rejects nicknames that already exist, even with blanks and different case', function (done) {
    api.isValidNickname(' haDa ', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });
});

