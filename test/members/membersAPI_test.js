'use strict';

var expect = require('must');
var sinon = require('sinon');
var conf = require('../../testutil/configureForTest');
var Member = conf.get('beans').get('member');

var memberstore = conf.get('beans').get('memberstore');

var api = conf.get('beans').get('membersAPI');

describe('MembersAPI', function () {

  beforeEach(function () {
    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      if (new RegExp(nickname, 'i').test('hada')) {
        return callback(null, new Member());
      }
      callback(null, null);
    });
  });

  afterEach(function () {
    memberstore.getMember.restore();
  });

  it('regards various nicknames as reserved words, ignoring the case', function () {
    expect(api.isReserved('edit')).to.be(true);
    expect(api.isReserved('eDit')).to.be(true);
    expect(api.isReserved('neW')).to.be(true);
    expect(api.isReserved('checknicKName')).to.be(true);
    expect(api.isReserved('submIt')).to.be(true);
    expect(api.isReserved('administration')).to.be(true);
    expect(api.isReserved('.')).to.be(true);
    expect(api.isReserved('..')).to.be(true);
  });

  it('accepts untrimmed versions of reserved words', function (done) {
    api.isValidNickname(' checknicKName ', function (err, result) {
      expect(result).to.be(true);
      done(err);
    });
  });

  it('rejects nicknames that already exist, ignoring case', function (done) {
    api.isValidNickname('haDa', function (err, result) {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('accepts nicknames that do not exist', function (done) {
    api.isValidNickname('haha', function (err, result) {
      expect(result).to.be(true);
      done(err);
    });
  });

  it('accepts nicknames that contain other nicknames', function (done) {
    api.isValidNickname('Sc' + 'hada' + 'r', function (err, result) {
      expect(result).to.be(true);
      done(err);
    });
  });

  it('accepts untrimmed versions of nicknames that already exist', function (done) {
    api.isValidNickname(' hada ', function (err, result) {
      expect(result).to.be(true);
      done(err);
    });
  });

  it('accepts nicknames containing ".." and "."', function () {
    expect(api.isReserved('a..')).to.be(false);
    expect(api.isReserved('a.')).to.be(false);
    expect(api.isReserved('..a')).to.be(false);
    expect(api.isReserved('.a')).to.be(false);
  });

});

