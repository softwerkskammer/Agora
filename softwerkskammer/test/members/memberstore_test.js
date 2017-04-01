'use strict';

const expect = require('must-dist');

const sinon = require('sinon').sandbox.create();

const beans = require('../../testutil/configureForTest').get('beans');
const persistence = beans.get('membersPersistence');
const subscriberPersistence = beans.get('subscribersPersistence');
const store = beans.get('memberstore');
const Member = beans.get('member');

describe('Members store', () => {
  const sampleMember = {nickname: 'nick', email: 'nicks mail', firstname: 'first', lastname: 'a'};
  const sampleMember2 = {nickname: 'nick2', email: 'nick2s mail', firstname: 'first', lastname: 'b'};

  const sampleList = [sampleMember, sampleMember2];

  afterEach(() => {
    sinon.restore();
  });

  it('calls persistence.getById for store.getMemberForId and passes on the given callback', done => {
    const getById = sinon.stub(persistence, 'getById').callsFake((field, callback) => {
      callback(null, sampleMember);
    });
    store.getMemberForId('id', (err, member) => {
      expect(member.nickname()).to.equal(sampleMember.nickname);
      expect(getById.calledWith('id')).to.be(true);
      done(err);
    });
  });

  it('calls persistence.listByIds for store.getMembersForIds and passes on the given callback', done => {
    const listByIds = sinon.stub(persistence, 'listByIds').callsFake((searchObject, sortOrder, callback) => {
      callback(null, sampleList);
    });

    store.getMembersForIds(['id1', 'id2'], (err, members) => {
      expect(members[0].nickname()).to.equal(sampleMember.nickname);
      expect(members[1].nickname()).to.equal(sampleMember2.nickname);
      expect(listByIds.calledWith(['id1', 'id2'])).to.be(true);
      done(err);
    });
  });

  it('calls persistence.getByField for store.getMemberForEMail and passes on the given callback', done => {
    sinon.stub(persistence, 'getByField').callsFake((object, callback) => {
      if (object.email.test('nick2s mail')) {
        return callback(null, sampleMember2);
      }
      if (object.email.test('nicks mail')) {
        return callback(null, sampleMember);
      }
      callback(null, null);
    });
    store.getMemberForEMail('nicks mail', (err, member) => {
      expect(member.nickname()).to.equal(sampleMember.nickname);
      done(err);
    });
  });

  it('calls persistence.getByField for each member for store.getMembersForEMails and passes on the given callback', done => {
    sinon.stub(persistence, 'listByField').callsFake((searchObject, sortOrder, callback) => {
      callback(null, sampleList);
    });
    store.getMembersForEMails(['nicks mail', 'nick2s mail'], (err, members) => {
      expect(members.length).to.equal(2);
      expect(members[0].nickname()).to.equal(sampleMember.nickname);
      expect(members[1].nickname()).to.equal(sampleMember2.nickname);
      expect(members[0]).to.be.instanceOf(Member);
      done(err);
    });
  });

  it('calls persistence.getByField with an appropriate regex', done => {
    const getByField = sinon.stub(persistence, 'getByField').callsFake((field, callback) => {
      callback(null, sampleMember);
    });
    store.getMember('nick', (err, member) => {
      expect(member.nickname()).to.equal(sampleMember.nickname);
      expect(getByField.called).to.be(true);
      const regex = getByField.args[0][0].nickname;
      expect(regex.toString()).to.equal('/^nick$/i');
      done(err);
    });
  });

  it('calls persistence.list for store.allMembers and passes on the given callback', done => {
    sinon.stub(persistence, 'listByField').callsFake((criteria, sortorder, callback) => {
      callback(null, sampleList);
    });

    store.allMembers((err, members) => {
      expect(members[0].nickname()).to.equal(sampleMember.nickname);
      expect(members[1].nickname()).to.equal(sampleMember2.nickname);
      done(err);
    });
  });

  it('sorts case insensitive by lastname', done => {
    const adonis = {lastname: 'Adonis', firstname: 'Zaza'};
    const betti = {lastname: 'Betti', firstname: 'Andi'};
    const dave = {lastname: 'Dave', firstname: 'Dave'};
    const bettiLow = {lastname: 'betti', firstname: 'Bodo'};
    const adonisLow = {lastname: 'adonis', firstname: 'Abbu'};

    sinon.stub(persistence, 'listByField').callsFake((criteria, sortorder, callback) => {
      callback(null, [adonis, betti, dave, bettiLow, adonisLow]);
    });

    store.allMembers((err, members) => {
      expect(members[0].lastname()).to.equal(adonisLow.lastname);
      expect(members[1].lastname()).to.equal(adonis.lastname);
      expect(members[2].lastname()).to.equal(betti.lastname);
      expect(members[3].lastname()).to.equal(bettiLow.lastname);
      expect(members[4].lastname()).to.equal(dave.lastname);
      done(err);
    });
  });

  it('sorts "naturally" by lastname - includes numbers', done => {
    const tata1 = {lastname: 'Tata1', firstname: 'Egal'};
    const tata10 = {lastname: 'Tata10', firstname: 'Egal'};
    const tata2 = {lastname: 'Tata2', firstname: 'Egal'};

    sinon.stub(persistence, 'listByField').callsFake((criteria, sortorder, callback) => {
      callback(null, [tata1, tata10, tata2]);
    });

    store.allMembers((err, members) => {
      expect(members[0].lastname()).to.equal(tata1.lastname);
      expect(members[1].lastname()).to.equal(tata2.lastname);
      expect(members[2].lastname()).to.equal(tata10.lastname);
      done(err);
    });
  });

  it('calls persistence.save for store.saveMember and passes on the given callback', done => {
    const save = sinon.stub(persistence, 'save').callsFake((member, callback) => { callback(); });

    store.saveMember(sampleMember, err => {
      expect(save.calledWith(sampleMember.state)).to.be(true);
      done(err);
    });
  });

  it('calls persistence.remove for store.removeMember and passes on the given callback', done => {
    const remove = sinon.stub(persistence, 'remove').callsFake((memberId, callback) => { callback(); });
    const member = new Member(sampleMember);
    member.state.id = 'I D';
    store.removeMember(member, err => {
      expect(remove.calledWith('I D')).to.be(true);
      done(err);
    });
  });

  it('returns an empty array when asked for all members for empty email list', done => {
    store.getMembersForEMails([], (err, members) => {
      expect(members).to.be.empty();
      done(err);
    });
  });

  it('tells that some user is a socrates subscriber', done => {
    sinon.stub(subscriberPersistence, 'getById').callsFake((memberId, callback) => { callback(null, {}); });
    store.isSoCraTesSubscriber('id', (err, isSubscriber) => {
      expect(isSubscriber).to.be(true);
      done(err);
    });
  });

});
