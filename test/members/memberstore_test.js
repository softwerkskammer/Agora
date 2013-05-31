"use strict";

var conf = require('../configureForTest');
var expect = require('chai').expect;

var sinon = require('sinon');
var sinonSandbox = sinon.sandbox.create();

var persistence = conf.get('beans').get('membersPersistence');
var store = conf.get('beans').get('memberstore');

describe('Members store', function () {
  var sampleMember = {nickname: 'nick'};
  var sampleMember2 = {nickname: 'nick2'};
  var sampleList = [sampleMember, sampleMember2];

  afterEach(function (done) {
    sinonSandbox.restore();
    done();
  });

  it('calls persistence.getByField for store.getMember and passes on the given callback', function (done) {
    var getByField = sinonSandbox.stub(persistence, 'getByField');
    getByField.callsArgWith(1, null, sampleMember);

    store.getMember('nick', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getByField.calledWith({nickname: new RegExp()})).to.be.true;
      done(err);
    });
  });

  it('calls persistence.getById for store.getMemberForId and passes on the given callback', function (done) {
    var getById = sinonSandbox.stub(persistence, 'getById');
    getById.callsArgWith(1, null, sampleMember);

    store.getMemberForId('id', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getById.calledWith('id')).to.be.true;
      done(err);
    });
  });

  it('calls persistence.listByIds for store.getMembersForIds and passes on the given callback', function (done) {
    var listByIds = sinonSandbox.stub(persistence, 'listByIds');
    listByIds.callsArgWith(2, null, sampleList);

    store.getMembersForIds(['id1', 'id2'], function (err, members) {
      expect(members[0].nickname).to.equal(sampleMember.nickname);
      expect(members[1].nickname).to.equal(sampleMember2.nickname);
      expect(listByIds.calledWith(['id1', 'id2'])).to.be.true;
      done(err);
    });
  });

  it('calls persistence.getByField trimmed for store.getMember and passes on the given callback', function (done) {
    var getByField = sinonSandbox.stub(persistence, 'getByField');
    getByField.callsArgWith(1, null, sampleMember);

    store.getMember('  nick  ', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getByField.calledWith({nickname: new RegExp()})).to.be.true;
      var regex = getByField.args[0][0].nickname;
      expect(regex.toString()).to.equal('/^nick$/i');
      done(err);
    });
  });

  it('calls persistence.getByField with an appropriate regex', function (done) {
    var getByField = sinonSandbox.stub(persistence, 'getByField');
    getByField.callsArgWith(1, null, sampleMember);

    store.getMember('nick', function (err, member) {
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
    var list = sinonSandbox.stub(persistence, 'list');
    list.callsArgWith(1, null, sampleList);

    store.allMembers(function (err, members) {
      expect(members[0].nickname).to.equal(sampleMember.nickname);
      expect(members[1].nickname).to.equal(sampleMember2.nickname);
      done(err);
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', function (done) {
    var save = sinonSandbox.stub(persistence, 'save');
    save.callsArg(1);

    store.saveMember(sampleMember, function (err) {
      expect(save.calledWith(sampleMember)).to.be.true;
      done(err);
    });
  });

});
