'use strict';

const sinon = require('sinon').sandbox.create();

const expect = require('must-dist');
const beans = require('../../testutil/configureForTest').get('beans');

const groupsForTest = require('./groups_for_tests');
const GroupA = groupsForTest.GroupA;
const GroupB = groupsForTest.GroupB;

const fakeListAdapter = beans.get('fakeListAdapter');
const systemUnderTest = beans.get('groupsService');

describe('Groups Service (updateSubscriptions)', () => {

  let subscribeSpy;
  let unsubscribeSpy;

  beforeEach(() => {
    subscribeSpy = sinon.stub(fakeListAdapter, 'addUserToList').callsFake((email, list, callback) => { callback(); });
    unsubscribeSpy = sinon.stub(fakeListAdapter, 'removeUserFromList').callsFake((email, list, callback) => { callback(); });
  });

  afterEach(() => {
    sinon.restore();
  });

  function setupSubscribedListsForUser(lists) {
    sinon.stub(fakeListAdapter, 'getSubscribedListsForUser').callsFake((email, callback) => {
      callback(null, lists);
    });
  }

  it('subscribes and unsubscribes no lists if both old and new subscription lists are empty', done => {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', [], err => {

      expect(subscribeSpy.called, 'subscribe is called').to.be(false);
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be(false);

      done(err);
    });
  });

  it('subscribes and unsubscribes no lists if old list contains one element and new subscription is the same element (not list)', done => {
    setupSubscribedListsForUser(['list1']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', 'list1', err => {

      expect(subscribeSpy.called, 'subscribe is called').to.be(false);
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be(false);

      done(err);
    });
  });

  it('subscribes list for new mail address and unsubscribes same list for old mail address if old and new mail addresses differ', done => {
    setupSubscribedListsForUser(['list1']);

    systemUnderTest.updateSubscriptions('user-new@mail.com', 'user-old@mail.com', 'list1', err => {

      expect(subscribeSpy.calledOnce, 'subscribe is called once').to.be(true);
      expect(subscribeSpy.calledWith('user-new@mail.com', 'list1'), 'list1 is subscribed with address user-new@mail.com').to.be(true);
      expect(unsubscribeSpy.calledOnce, 'unsubscribe is called once').to.be(true);
      expect(unsubscribeSpy.calledWith('user-old@mail.com', 'list1'), 'list1 is unsubscribed with address user-old@mail.com').to.be(true);

      done(err);
    });
  });

  it('subscribes and unsubscribes no lists if old and new subscription lists contain the same lists', done => {
    setupSubscribedListsForUser(['list1', 'list2']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', ['list1', 'list2'], err => {

      expect(subscribeSpy.called, 'subscribe is called').to.be(false);
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be(false);

      done(err);
    });
  });

  it('subscribes one list if old subscriptions are empty and new ones contain one listname (not array)', done => {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', 'list1', err => {

      expect(subscribeSpy.calledOnce, 'subscribe is called once').to.be(true);
      expect(subscribeSpy.calledWith('user@mail.com', 'list1')).to.be(true);
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be(false);

      done(err);
    });
  });

  it('subscribes one list if old subscriptions are empty and new ones contain one listname in an array', done => {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', ['list1'], err => {

      expect(subscribeSpy.calledOnce, 'subscribe is called once').to.be(true);
      expect(subscribeSpy.calledWith('user@mail.com', 'list1')).to.be(true);
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be(false);

      done(err);
    });
  });

  it('unsubscribes one list if old subscriptions contain a list and new ones are undefined', done => {
    setupSubscribedListsForUser(['list1']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', undefined, err => {

      expect(subscribeSpy.called, 'subscribe is called').to.be(false);
      expect(unsubscribeSpy.calledOnce, 'unsubscribe is called once').to.be(true);
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be(true);

      done(err);
    });
  });

  it('unsubscribes one list if old subscriptions contain a list and new ones are an empty array', done => {
    setupSubscribedListsForUser(['list1']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', [], err => {

      expect(subscribeSpy.called, 'subscribe is called').to.be(false);
      expect(unsubscribeSpy.calledOnce, 'unsubscribe is called once').to.be(true);
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be(true);

      done(err);
    });
  });

  it('subscribes and unsubscribes appropriately if there are many changes', done => {
    setupSubscribedListsForUser(['list1', 'list2', 'list3']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', ['list2', 'list4', 'list5'], err => {

      expect(subscribeSpy.calledTwice, 'subscribe is called twice').to.be(true);
      expect(unsubscribeSpy.calledTwice, 'unsubscribe is called twice').to.be(true);
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be(true);
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list3')).to.be(true);
      expect(subscribeSpy.calledWith('user@mail.com', 'list4')).to.be(true);
      expect(subscribeSpy.calledWith('user@mail.com', 'list5')).to.be(true);

      done(err);
    });
  });

  it('subscribes and unsubscribes appropriately if there are many changes and the email addresses differ', done => {
    setupSubscribedListsForUser(['list1', 'list2', 'list3']);

    systemUnderTest.updateSubscriptions('user-new@mail.com', 'user-old@mail.com', ['list2', 'list4', 'list5'], err => {

      expect(subscribeSpy.calledThrice, 'subscribe is called thrice').to.be(true);
      expect(unsubscribeSpy.calledThrice, 'unsubscribe is called thrice').to.be(true);
      expect(unsubscribeSpy.calledWith('user-old@mail.com', 'list1')).to.be(true);
      expect(unsubscribeSpy.calledWith('user-old@mail.com', 'list2')).to.be(true);
      expect(unsubscribeSpy.calledWith('user-old@mail.com', 'list3')).to.be(true);
      expect(subscribeSpy.calledWith('user-new@mail.com', 'list2')).to.be(true);
      expect(subscribeSpy.calledWith('user-new@mail.com', 'list4')).to.be(true);
      expect(subscribeSpy.calledWith('user-new@mail.com', 'list5')).to.be(true);

      done(err);
    });
  });

});

describe('Groups Service (combineSubscribedAndAvailableGroups)', () => {

  it('combines no subscribed and no available groups to an empty array', () => {
    const result = systemUnderTest.combineSubscribedAndAvailableGroups([], []);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(0);
  });

  it('combines some subscribed but no available groups to an empty array', () => {
    const result = systemUnderTest.combineSubscribedAndAvailableGroups([GroupA, GroupB], []);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(0);
  });

  it('combines no subscribed and one available group to indicate an unselected group', () => {
    const result = systemUnderTest.combineSubscribedAndAvailableGroups([], [GroupA]);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be(false);
  });

  it('combines one subscribed and another available group to indicate an unselected group', () => {
    const result = systemUnderTest.combineSubscribedAndAvailableGroups([GroupA], [GroupB]);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupB);
    expect(result[0].selected, 'selected').to.be(false);
  });

  it('combines one subscribed and the same available group to indicate a selected group', () => {
    const result = systemUnderTest.combineSubscribedAndAvailableGroups([GroupA], [GroupA]);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be(true);
  });

  it('combines some subscribed and some available groups to indicate the correct selections', () => {
    const result = systemUnderTest.combineSubscribedAndAvailableGroups([GroupA], [GroupA, GroupB]);

    expect(result).to.not.be(null);
    expect(result.length).to.equal(2);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be(true);
    expect(result[1].group, 'group').to.equal(GroupB);
    expect(result[1].selected, 'selected').to.be(false);
  });
});


