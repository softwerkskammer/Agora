"use strict";

var expect = require('chai').expect;

var sinon = require('sinon').sandbox.create();

var beans = require('../configureForTest').get('beans');
var persistence = beans.get('membersPersistence');
var store = beans.get('memberstore');
var Member = beans.get('member');

describe('Members store', function () {
  var sampleMember = {nickname: 'nick', email: 'nicks mail'};
  var sampleMember2 = {nickname: 'nick2', email: 'nick2s mail'};
  var sampleList = [sampleMember, sampleMember2];

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  it('calls persistence.getByField for store.getMember and passes on the given callback', function (done) {
    var getByField = sinon.stub(persistence, 'getByField');
    getByField.callsArgWith(1, null, sampleMember);

    store.getMember('nick', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getByField.calledWith({nickname: new RegExp()})).to.be.true;
      done(err);
    });
  });

  it('calls persistence.getById for store.getMemberForId and passes on the given callback', function (done) {
    var getById = sinon.stub(persistence, 'getById');
    getById.callsArgWith(1, null, sampleMember);

    store.getMemberForId('id', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getById.calledWith('id')).to.be.true;
      done(err);
    });
  });

  it('calls persistence.listByIds for store.getMembersForIds and passes on the given callback', function (done) {
    var listByIds = sinon.stub(persistence, 'listByIds');
    listByIds.callsArgWith(2, null, sampleList);

    store.getMembersForIds(['id1', 'id2'], function (err, members) {
      expect(members[0].nickname).to.equal(sampleMember.nickname);
      expect(members[1].nickname).to.equal(sampleMember2.nickname);
      expect(listByIds.calledWith(['id1', 'id2'])).to.be.true;
      done(err);
    });
  });

  it('calls persistence.getByField trimmed for store.getMember and passes on the given callback', function (done) {
    var getByField = sinon.stub(persistence, 'getByField');
    getByField.callsArgWith(1, null, sampleMember);

    store.getMember('  nick  ', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      expect(getByField.calledWith({nickname: new RegExp()})).to.be.true;
      var regex = getByField.args[0][0].nickname;
      expect(regex.toString()).to.equal('/^nick$/i');
      done(err);
    });
  });

  it('calls persistence.getByField for store.getMemberForEMail and passes on the given callback', function (done) {
    sinon.stub(persistence, 'getByField', function (object, callback) {
      if (object.email.test('nick2s mail')) {
        return callback(null, sampleMember2);
      }
      if (object.email.test('nicks mail')) {
        return callback(null, sampleMember);
      }
      callback(null, null);
    });
    store.getMemberForEMail('nicks mail', function (err, member) {
      expect(member.nickname).to.equal(sampleMember.nickname);
      done(err);
    });
  });

  it('calls persistence.getByField for each member for store.getMembersForEMails and passes on the given callback', function (done) {
    sinon.stub(persistence, 'listByField', function (searchObject, sortOrder, callback) {
      callback(null, [sampleMember2, sampleMember]);
    });
    store.getMembersForEMails(['nicks mail', 'nick2s mail'], function (err, members) {
      expect(members.length).to.equal(2);
      expect(members[0].nickname).to.equal(sampleMember2.nickname);
      expect(members[1].nickname).to.equal(sampleMember.nickname);
      expect(members[0]).to.be.instanceOf(Member);
      done(err);
    });
  });

  it('calls persistence.getByField with an appropriate regex', function (done) {
    var getByField = sinon.stub(persistence, 'getByField');
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
    var list = sinon.stub(persistence, 'list');
    list.callsArgWith(1, null, sampleList);

    store.allMembers(function (err, members) {
      expect(members[0].nickname).to.equal(sampleMember.nickname);
      expect(members[1].nickname).to.equal(sampleMember2.nickname);
      done(err);
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', function (done) {
    var save = sinon.stub(persistence, 'save');
    save.callsArg(1);

    store.saveMember(sampleMember, function (err) {
      expect(save.calledWith(sampleMember)).to.be.true;
      done(err);
    });
  });

  it('returns an empty array when asked for all members for empty email list', function (done) {
    store.getMembersForEMails([], function (err, members) {
      expect(members).to.be.empty;
      done();
    });
  });

});
