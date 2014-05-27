'use strict';

var expect = require('must');

var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var persistence = beans.get('membersPersistence');
var store = beans.get('memberstore');
var Member = beans.get('member');

describe('Members store', function () {
  var sampleMember = {nickname: 'nick', email: 'nicks mail', firstname: 'first', lastname: 'a'};
  var sampleMember2 = {nickname: 'nick2', email: 'nick2s mail', firstname: 'first', lastname: 'b'};

  var sampleList = [sampleMember, sampleMember2];

  afterEach(function () {
    sinon.restore();
  });

  it('calls persistence.getById for store.getMemberForId and passes on the given callback', function (done) {
    var getById = sinon.stub(persistence, 'getById', function (field, callback) {
      callback(null, sampleMember);
    });
    store.getMemberForId('id', function (err, member) {
      expect(member.nickname()).to.equal(sampleMember.nickname);
      expect(getById.calledWith('id')).to.be(true);
      done(err);
    });
  });

  it('calls persistence.listByIds for store.getMembersForIds and passes on the given callback', function (done) {
    var listByIds = sinon.stub(persistence, 'listByIds', function (searchObject, sortOrder, callback) {
      callback(null, sampleList);
    });

    store.getMembersForIds(['id1', 'id2'], function (err, members) {
      expect(members[0].nickname()).to.equal(sampleMember.nickname);
      expect(members[1].nickname()).to.equal(sampleMember2.nickname);
      expect(listByIds.calledWith(['id1', 'id2'])).to.be(true);
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
      expect(member.nickname()).to.equal(sampleMember.nickname);
      done(err);
    });
  });

  it('calls persistence.getByField for each member for store.getMembersForEMails and passes on the given callback', function (done) {
    sinon.stub(persistence, 'listByField', function (searchObject, sortOrder, callback) {
      callback(null, sampleList);
    });
    store.getMembersForEMails(['nicks mail', 'nick2s mail'], function (err, members) {
      expect(members.length).to.equal(2);
      expect(members[0].nickname()).to.equal(sampleMember.nickname);
      expect(members[1].nickname()).to.equal(sampleMember2.nickname);
      expect(members[0]).to.be.instanceOf(Member);
      done(err);
    });
  });

  it('calls persistence.getByField with an appropriate regex', function (done) {
    var getByField = sinon.stub(persistence, 'getByField', function (field, callback) {
      callback(null, sampleMember);
    });
    store.getMember('nick', function (err, member) {
      expect(member.nickname()).to.equal(sampleMember.nickname);
      expect(getByField.called).to.be(true);
      var regex = getByField.args[0][0].nickname;
      expect(regex.toString()).to.equal('/^nick$/i');
      done(err);
    });
  });

  it('calls persistence.list for store.allMembers and passes on the given callback', function (done) {
    sinon.stub(persistence, 'list', function (sortorder, callback) {
      callback(null, sampleList);
    });

    store.allMembers(function (err, members) {
      expect(members[0].nickname()).to.equal(sampleMember.nickname);
      expect(members[1].nickname()).to.equal(sampleMember2.nickname);
      done(err);
    });
  });

  it('sorts case insensitive by lastname', function (done) {
    var adonis = { lastname: 'Adonis', firstname: 'Zaza' };
    var betti = { lastname: 'Betti', firstname: 'Andi' };
    var dave = { lastname: 'Dave', firstname: 'Dave' };
    var betti_low = { lastname: 'betti', firstname: 'Bodo' };
    var adonis_low = { lastname: 'adonis', firstname: 'Abbu' };

    sinon.stub(persistence, 'list', function (sortorder, callback) {
      callback(null, [adonis, betti, dave, betti_low, adonis_low]);
    });

    store.allMembers(function (err, members) {
      expect(members[0].lastname()).to.equal(adonis_low.lastname);
      expect(members[1].lastname()).to.equal(adonis.lastname);
      expect(members[2].lastname()).to.equal(betti.lastname);
      expect(members[3].lastname()).to.equal(betti_low.lastname);
      expect(members[4].lastname()).to.equal(dave.lastname);
      done(err);
    });
  });

  it('sorts "naturally" by lastname - includes numbers', function (done) {
    var tata1 = { lastname: 'Tata1', firstname: 'Egal' };
    var tata10 = { lastname: 'Tata10', firstname: 'Egal' };
    var tata2 = { lastname: 'Tata2', firstname: 'Egal' };

    sinon.stub(persistence, 'list', function (sortorder, callback) {
      callback(null, [tata1, tata10, tata2]);
    });

    store.allMembers(function (err, members) {
      expect(members[0].lastname()).to.equal(tata1.lastname);
      expect(members[1].lastname()).to.equal(tata2.lastname);
      expect(members[2].lastname()).to.equal(tata10.lastname);
      done(err);
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', function (done) {
    var save = sinon.stub(persistence, 'save', function (member, callback) { callback(); });

    store.saveMember(sampleMember, function (err) {
      expect(save.calledWith(sampleMember.state)).to.be(true);
      done(err);
    });
  });

  it('returns an empty array when asked for all members for empty email list', function (done) {
    store.getMembersForEMails([], function (err, members) {
      expect(members).to.be.empty();
      done(err);
    });
  });

});
