"use strict";

var expect = require('chai').expect;
var sinon = require('sinon');
var conf = require('../configureForTest');
var Member = conf.get('beans').get('member');

var memberstore = conf.get('beans').get('memberstore');

var api = conf.get('beans').get('membersAPI');

describe('MembersAPI', function () {

  beforeEach(function (done) {
    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      if (new RegExp(nickname, 'i').test('hada')) {
        return callback(null, new Member());
      }
      callback(null, null);
    });
    done();
  });

  afterEach(function (done) {
    memberstore.getMember.restore();
    done();
  });

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

  it('rejects nicknames that already exist, even with blanks and different case', function (done) {
    api.isValidNickname(' haDa ', function (err, result) {
      expect(result).to.be.false;
      done();
    });
  });

  it('rejects nicknames ".." and "."', function (done) {
    expect(api.isReserved('..')).to.be.true;
    expect(api.isReserved('.')).to.be.true;
    done();
  });

  it('tolerates nicknames containing ".." and "."', function (done) {
    expect(api.isReserved('a..')).to.be.false;
    expect(api.isReserved('a.')).to.be.false;
    expect(api.isReserved('..a')).to.be.false;
    expect(api.isReserved('.a')).to.be.false;
    done();
  });

});

