'use strict';

const sinon = require('sinon').createSandbox();

const expect = require('must-dist');
const beans = require('../../testutil/configureForTest').get('beans');

const groupsForTest = require('./groups_for_tests');

const groupstore = beans.get('groupstore');
const systemUnderTest = beans.get('groupsService');

const Member = beans.get('member');
const testMember = new Member({id: 'testmember'});


describe('Groups Service (updateSubscriptions)', () => {

  let testGroups;
  let saveGroupSpy;

  beforeEach(() => {
    saveGroupSpy = sinon.stub(groupstore, 'saveGroup').callsFake((group, callback) => { callback(); });
  });

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

  it('subscribes and unsubscribes no lists if both old and new subscription lists are empty', done => {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions(testMember, [], err => {
      expect(saveGroupSpy.called, 'group changed and saved').to.be(false);
      done(err);
    });
  });

  it('subscribes and unsubscribes no lists if old list contains one element and new subscription is the same element (not array)', done => {
    setupSubscribedListsForUser(['groupa']);

    systemUnderTest.updateSubscriptions(testMember, 'groupa', err => {
      expect(saveGroupSpy.called, 'group changed and saved').to.be(false);
      done(err);
    });
  });

  it('subscribes and unsubscribes no lists if old and new subscription lists contain the same lists', done => {
    setupSubscribedListsForUser(['groupa', 'groupb']);

    systemUnderTest.updateSubscriptions(testMember, ['groupa', 'groupb'], err => {
      expect(saveGroupSpy.called, 'group changed and saved').to.be(false);
      done(err);
    });
  });

  it('subscribes one list if old subscriptions are empty and new ones contain one listname (not array)', done => {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions(testMember, 'groupa', err => {
      expect(saveGroupSpy.calledOnce, 'group changed and saved').to.be(true);
      expect(saveGroupSpy.calledWith(testGroups.GroupA)).to.be(true);
      done(err);
    });
  });

  it('subscribes one list if old subscriptions are empty and new ones contain one listname in an array', done => {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions(testMember, ['groupa'], err => {
      expect(saveGroupSpy.calledOnce, 'group changed and saved').to.be(true);
      expect(saveGroupSpy.calledWith(testGroups.GroupA)).to.be(true);
      expect(testGroups.GroupA.subscribedMembers).to.include(testMember.id());
      done(err);
    });
  });

  it('unsubscribes one list if old subscriptions contain a list and new ones are undefined', done => {
    setupSubscribedListsForUser(['groupa']);
    expect(testGroups.GroupA.subscribedMembers).to.include(testMember.id());

    systemUnderTest.updateSubscriptions(testMember, undefined, err => {
      expect(saveGroupSpy.calledOnce, 'group changed and saved').to.be(true);
      expect(saveGroupSpy.calledWith(testGroups.GroupA)).to.be(true);
      expect(testGroups.GroupA.subscribedMembers).not.to.include(testMember.id());
      done(err);
    });
  });

  it('unsubscribes one list if old subscriptions contain a list and new ones are an empty array', done => {
    setupSubscribedListsForUser(['groupa']);
    expect(testGroups.GroupA.subscribedMembers).to.include(testMember.id());

    systemUnderTest.updateSubscriptions(testMember, [], err => {
      expect(saveGroupSpy.calledOnce, 'group changed and saved').to.be(true);
      expect(saveGroupSpy.calledWith(testGroups.GroupA)).to.be(true);
      expect(testGroups.GroupA.subscribedMembers).not.to.include(testMember.id());
      done(err);
    });
  });

  it('subscribes and unsubscribes appropriately if there are many changes', done => {
    setupSubscribedListsForUser(['groupa', 'groupb']);

    systemUnderTest.updateSubscriptions(testMember, ['groupb', 'groupc'], err => {
      expect(saveGroupSpy.calledTwice, 'each group changed and saved').to.be(true);
      expect(saveGroupSpy.calledWith(testGroups.GroupA)).to.be(true);
      expect(saveGroupSpy.calledWith(testGroups.GroupB), 'GroupB was not changed').to.be(false);
      expect(saveGroupSpy.calledWith(testGroups.GroupC)).to.be(true);
      expect(testGroups.GroupA.subscribedMembers).not.to.include(testMember.id());
      expect(testGroups.GroupB.subscribedMembers).to.include(testMember.id());
      expect(testGroups.GroupC.subscribedMembers).to.include(testMember.id());
      done(err);
    });
  });

});

describe('Groups Service (markGroupsSelected)', () => {
  const testGroups = groupsForTest();
  const GroupA = testGroups.GroupA;
  const GroupB = testGroups.GroupB;

  it('combines no subscribed and no available groups to an empty array', () => {
    const result = systemUnderTest.markGroupsSelected([], []);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(0);
  });

  it('combines some subscribed but no available groups to an empty array', () => {
    const result = systemUnderTest.markGroupsSelected([GroupA, GroupB], []);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(0);
  });

  it('combines no subscribed and one available group to indicate an unselected group', () => {
    const result = systemUnderTest.markGroupsSelected([], [GroupA]);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be(false);
  });

  it('combines one subscribed and another available group to indicate an unselected group', () => {
    const result = systemUnderTest.markGroupsSelected([GroupA], [GroupB]);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupB);
    expect(result[0].selected, 'selected').to.be(false);
  });

  it('combines one subscribed and the same available group to indicate a selected group', () => {
    const result = systemUnderTest.markGroupsSelected([GroupA], [GroupA]);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be(true);
  });

  it('combines some subscribed and some available groups to indicate the correct selections', () => {
    const result = systemUnderTest.markGroupsSelected([GroupA], [GroupA, GroupB]);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(2);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be(true);
    expect(result[1].group, 'group').to.equal(GroupB);
    expect(result[1].selected, 'selected').to.be(false);
  });
});


