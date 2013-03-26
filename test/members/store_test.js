/*global describe, it */
"use strict";

var proxyquire = require('proxyquire'),
  sinon = require('sinon');

var persistenceStub = {
  save: function () {},
  getById: function () {},
  list: function () {}
};

var store = proxyquire('../../lib/members/store.js', {'../persistence/persistence': function () { return persistenceStub; }});

describe('Members store', function () {
  var sampleMember = {};
  var sampleList = [sampleMember];

  it('calls persistence.getById for store.getMember and passes on the given callback', function (done)  {
    var getById = sinon.stub(persistenceStub, 'getById');
    getById.callsArgWith(1, sampleMember);

    store.getMember('nick', function (member) {
      member.should.equal(sampleMember);
      getById.calledWith('nick').should.be.true;
      done();
    });
  });

  it('calls persistence.list for store.allMembers and passes on the given callback', function (done)  {
    var list = sinon.stub(persistenceStub, 'list');
    list.callsArgWith(0, sampleList);

    store.allMembers(function (members) {
      members.should.equal(sampleList);
      done();
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', function (done)  {
    var save = sinon.stub(persistenceStub, 'save');
    save.callsArg(1);

    store.saveMember(sampleMember, function () {
      save.calledWith(sampleMember).should.be.true;
      done();
    });
  });

});
