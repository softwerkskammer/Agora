'use strict';

const sinon = require('sinon').createSandbox();
const expect = require('must-dist');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const Group = beans.get('group');

const groupsForTest = require('./groups_for_tests');

const groupstore = beans.get('groupstore');

const groupsService = beans.get('groupsService');

const Member = beans.get('member');
const testMember = new Member({id: 'testmember'});

describe('Groups Service (getSubscribedGroupsForMember)', () => {
  let testGroups;

  afterEach(() => {
    sinon.restore();
  });

  function setupSubscribedListsForUser(groups) {
    testGroups = groupsForTest();
    const testGroupsArray = [testGroups.GroupA, testGroups.GroupB, testGroups.GroupC]
      .map(
        g => {
          if (groups.includes(g.id)) { g.subscribe(testMember); }
          return g;
        }
      );
    sinon.stub(groupstore, 'allGroups').callsFake(callback => {
      callback(null, testGroupsArray);
    });
  }

  it('returns an empty array of groups for a user who is not subscribed anywhere', done => {
    setupSubscribedListsForUser([]);

    groupsService.getSubscribedGroupsForMember(testMember, (err, validLists) => {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(0);
      done(err);
    });
  });

  it('returns one group for a user who is subscribed to one list', done => {
    setupSubscribedListsForUser(['groupa']);

    groupsService.getSubscribedGroupsForMember(testMember, (err, validLists) => {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(1);
      expect(validLists[0]).to.equal(testGroups.GroupA);
      done(err);
    });
  });

  it('returns two groups for a user who is subscribed to two lists', done => {
    setupSubscribedListsForUser(['groupa', 'groupb']);

    groupsService.getSubscribedGroupsForMember(testMember, (err, validLists) => {
      expect(validLists).to.not.be(null);
      expect(validLists.length).to.equal(2);
      expect(validLists[0]).to.equal(testGroups.GroupA);
      expect(validLists[1]).to.equal(testGroups.GroupB);
      done(err);
    });
  });

  it('handles errors in retrieving lists', done => {
    sinon.stub(groupstore, 'allGroups').callsFake(callback => {
      callback(new Error());
    });

    groupsService.getSubscribedGroupsForMember('admin@softwerkskammer.de', err => {
      expect(err).to.exist();
      done();
    });
  });
});

describe('Groups Service (getAllAvailableGroups)', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('returns an empty array of groups if there are no lists defined in mailinglist', done => {
    const spy = sinon.stub(groupstore, 'allGroups').callsFake(callback => {
      callback(null, []);
    });

    groupsService.getAllAvailableGroups((err, lists) => {
      expect(spy.called).to.be(true);
      expect(lists).to.not.be(null);
      expect(lists.length).to.equal(0);
      done(err);
    });
  });
});

describe('Groups Service (createOrSaveGroup)', () => {

  afterEach(() => {
    sinon.restore();
  });

  it('creates a new group and saves it if there is no group with the given name', done => {
    const spy = sinon.stub(groupstore, 'saveGroup').callsFake((group, callback) => {
      callback(null);
    });

    groupsService.createOrSaveGroup({}, err => {
      expect(spy.calledOnce).to.be(true);
      done(err);
    });
  });
});

describe('Groups Service (groupFromObject)', () => {
  it('returns a new Group object if there is no valid group data', () => {
    const result = new Group({id: 'x'});

    expect(result).to.not.be(null);
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.equal('x');
    expect(result.longName).to.be(undefined);
    expect(result.description).to.be(undefined);
    expect(result.type).to.be(undefined);
  });

  it('returns a valid Group object if there is valid group data', () => {
    const result = new Group({
      id: 'craftsmanswap',
      longName: 'Craftsman Swaps',
      description: 'A group for organizing CS',
      type: 'Themengruppe'
    });

    expect(result).to.not.be(null);
    expect(result).to.be.instanceOf(Group);
    expect(result.id).to.equal('craftsmanswap');
    expect(result.longName).to.equal('Craftsman Swaps');
    expect(result.description).to.equal('A group for organizing CS');
    expect(result.type).to.equal('Themengruppe');
  });
});

describe('Groups Service (allGroupColors)', () => {
  const groups = groupsForTest();
  const GroupA = groups.GroupA;
  const GroupB = groups.GroupB;

  afterEach(() => {
    sinon.restore();
  });

  it('returns an object with group id and color', done => {
    GroupA.color = '#FFFFFF';
    GroupB.color = '#AAAAAA';
    sinon.stub(groupstore, 'allGroups').callsFake(globalCallback => {
      globalCallback(null, [GroupA, GroupB]);
    });

    groupsService.allGroupColors((err, colorMap) => {
      expect(colorMap).to.have.ownProperty('groupa', '#FFFFFF');
      expect(colorMap).to.have.ownProperty('groupb', '#AAAAAA');
      done(err);
    });
  });

  it('handles an error gracefully', done => {
    sinon.stub(groupstore, 'allGroups').callsFake(globalCallback => {
      globalCallback(new Error());
    });

    groupsService.allGroupColors(err => {
      expect(err).to.exist();
      done();
    });
  });
});

describe('Groups Service (isGroupNameAvailable)', () => {
  const groups = groupsForTest();
  const GroupA = groups.GroupA;
  const GroupB = groups.GroupB;

  before(() => {
    sinon.stub(groupstore, 'getGroup').callsFake((groupname, callback) => {
      if (groupname === 'GroupA') {
        callback(null, GroupA);
      } else if (groupname === 'GroupB') {
        callback(null, GroupB);
      } else if (groupname === 'ErrorGroup') {
        callback(new Error('Ouch! Something bad happened...'));
      } else {
        callback(null, null);
      }
    });
  });

  after(() => {
    sinon.restore();
  });

  it('handles Errors', done => {
    groupsService.isGroupNameAvailable('ErrorGroup', err => {
      expect(err).to.exist();
      done();
    });
  });

  it('returns false when there is already a group of this name present', done => {
    groupsService.isGroupNameAvailable('GroupA', (err, result) => {
      expect(result).to.not.be(null);
      expect(result).to.be(false);
      done(err);
    });
  });

  it('returns true when there is no group of this name present', done => {
    groupsService.isGroupNameAvailable('MyGroup', (err, result) => {
      expect(result).to.not.be(null);
      expect(result).to.be(true);
      done(err);
    });
  });

  it('returns an error when the group fetching is not successful', function (done) {
    groupsService.isGroupNameAvailable('ErrorGroup', function (err, result) {
      expect(result).to.be(false);
      expect(err).to.not.be(null);
      done(); // we expect an error
    });
  });

  it('rejects groupnames that contain special characters', function (done) {
    expect(groupsService.isReserved('Sch adar')).to.be(true);
    expect(groupsService.isReserved('Sch/adar')).to.be(true);
    expect(groupsService.isReserved('Schad\nar')).to.be(true);
    expect(groupsService.isReserved('Schad@r')).to.be(true);

    groupsService.isGroupNameAvailable('Scha dar', (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('allows groupnames that contain alphanumeric characters only', done => {
    expect(groupsService.isReserved('Schad_r')).to.be(false);
    expect(groupsService.isReserved('Schadar')).to.be(false);

    groupsService.isGroupNameAvailable('Schadar', (err, result) => {
      expect(result).to.be(true);
      done(err);
    });
  });

  it('rejects groupnames that contain reserved routes', done => {
    expect(groupsService.isReserved('new')).to.be(true);
    expect(groupsService.isReserved('submit')).to.be(true);
    expect(groupsService.isReserved('administration')).to.be(true);
    expect(groupsService.isReserved('edit')).to.be(true);
    expect(groupsService.isReserved('checkgroupname')).to.be(true);

    groupsService.isGroupNameAvailable('edit', (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });
});

describe('Groups Service (isEmailPrefixAvailable)', () => {
  it('returns false for an undefined prefix', done => {
    groupsService.isEmailPrefixAvailable(undefined, (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('returns false for a null prefix', done => {
    groupsService.isEmailPrefixAvailable(null, (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });

  it('returns false for an empty prefix', done => {
    groupsService.isEmailPrefixAvailable('', (err, result) => {
      expect(result).to.be(false);
      done(err);
    });
  });
});
