/*global describe, it */
"use strict";
require('chai').should();

var proxyquire = require('proxyquire'),
  sinon = require('sinon');

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
      member.nickname.should.equal(sampleMember.nickname);
      getByField.calledWith({nickname: new RegExp()}).should.be.true;
      done(err);
    });
  });

  it('calls persistence.getByField trimmed for store.getMember and passes on the given callback', function (done) {
    store().getMember('  nick  ', function (err, member) {
      member.nickname.should.equal(sampleMember.nickname);
      getByField.calledWith({nickname: new RegExp()}).should.be.true;
      var regex = getByField.args[0][0].nickname;
      regex.toString().should.equal('/^nick$/i');
      done(err);
    });
  });

  it('calls persistence.getByField with an appropriate regex', function (done) {
    store().getMember('nick', function (err, member) {
      member.nickname.should.equal(sampleMember.nickname);
      getByField.calledWith({nickname: new RegExp()}).should.be.true;
      var regex = getByField.args[0][0].nickname;
      regex.test('nick').should.be.true;
      regex.test('nICk').should.be.true;
      regex.test('nICklaus').should.be.false;
      done(err);
    });
  });

  it('calls persistence.list for store.allMembers and passes on the given callback', function (done) {
    var list = sinon.stub(persistenceStub, 'list');
    list.callsArgWith(1, null, sampleList);

    store().allMembers(function (err, members) {
      members[0].nickname.should.equal(sampleMember.nickname);
      members[1].nickname.should.equal(sampleMember2.nickname);
      done(err);
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', function (done) {
    var save = sinon.stub(persistenceStub, 'save');
    save.callsArg(1);

    store().saveMember(sampleMember, function (err) {
      save.calledWith(sampleMember).should.be.true;
      done(err);
    });
  });

});
