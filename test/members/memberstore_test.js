/*global describe, it */
"use strict";
var expect = require('chai').expect;

var proxyquire = require('proxyquire');
var sinon = require('sinon');

var persistenceStub = {
  save: function () {
  },
  getById: function () {
  },
  getByField: function () {
  },
  list: function () {
  }
};

var store = proxyquire('../../lib/members/memberstore.js', {'../persistence/persistence': function () {
  return persistenceStub;
}});

describe('Members store', function () {
  var sampleMember = {nickname: 'nick'};
  var sampleMember2 = {nickname: 'nick2'};
  var sampleList = [sampleMember, sampleMember2];
  var getByField = sinon.stub(persistenceStub, 'getByField');
  getByField.callsArgWith(1, null, sampleMember);

  it('calls persistence.getByField for store.getMember and passes on the given callback', function (done) {
    store().getMember('nick', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getByField.calledWith({nickname: new RegExp()})).to.be.true;
      done(err);
    });
  });

  it('calls persistence.getByField trimmed for store.getMember and passes on the given callback', function (done) {
    store().getMember('  nick  ', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getByField.calledWith({nickname: new RegExp()})).to.be.true;
      var regex = getByField.args[0][0].nickname;
      expect(regex.toString()).to.equal('/^nick$/i');
      done(err);
    });
  });

  it('calls persistence.getByField with an appropriate regex', function (done) {
    store().getMember('nick', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getByField.calledWith({nickname: new RegExp()})).to.be.true;
      var regex = getByField.args[0][0].nickname;
      expect(regex.test('nick')).to.be.true;
      expect(regex.test('nICk')).to.be.true;
      expect(regex.test('nICklaus')).to.be.false;
      done(err);
    });
  });

  it('calls persistence.list for store.allMembers and passes on the given callback', function (done) {
    var list = sinon.stub(persistenceStub, 'list');
    list.callsArgWith(1, null, sampleList);

    store().allMembers(function (err, members) {
      expect(members[0].nickname).to.equal(sampleMember.nickname);
      expect(members[1].nickname).to.equal(sampleMember2.nickname);
      done(err);
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', function (done) {
    var save = sinon.stub(persistenceStub, 'save');
    save.callsArg(1);

    store().saveMember(sampleMember, function (err) {
      expect(save.calledWith(sampleMember)).to.be.true;
      done(err);
    });
  });

});
