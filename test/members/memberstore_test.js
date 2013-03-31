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
  var sampleList = [sampleMember];

  it('calls persistence.getByField for store.getMember and passes on the given callback', function (done) {
    var getByField = sinon.stub(persistenceStub, 'getByField');
    getByField.callsArgWith(1, null, sampleMember);

    store().getMember('nick', function (err, member) {
      member.nickname.should.equal(sampleMember.nickname);
      getByField.calledWith({nickname: 'nick'}).should.be.true;
      done();
    });
  });

  it('calls persistence.list for store.allMembers and passes on the given callback', function (done) {
    var list = sinon.stub(persistenceStub, 'list');
    list.callsArgWith(0, null, sampleList);

    store().allMembers(function (err, members) {
      members.should.equal(sampleList);
      done();
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', function (done) {
    var save = sinon.stub(persistenceStub, 'save');
    save.callsArg(1);

    store().saveMember(sampleMember, function () {
      save.calledWith(sampleMember).should.be.true;
      done();
    });
  });

});
