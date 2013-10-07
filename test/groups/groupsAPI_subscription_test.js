"use strict";

var sinon = require('sinon');

var expect = require('chai').expect;
var conf = require('../configureForTest');

var Group = conf.get('beans').get('group');

var GroupA = new Group({id: 'GroupA', longName: 'Gruppe A', description: 'Dies ist Gruppe A.', type: 'Themengruppe'});
var GroupB = new Group({id: 'GroupB', longName: 'Gruppe B', description: 'Dies ist Gruppe B.', type: 'Regionalgruppe'});

var sympaStub = conf.get('beans').get('sympaStub');
var systemUnderTest = conf.get('beans').get('groupsAPI');

describe('Groups API (updateSubscriptions)', function () {

  var subscribeSpy;
  var unsubscribeSpy;

  beforeEach(function (done) {
    systemUnderTest.refreshCache();
    subscribeSpy = sinon.stub(sympaStub, 'addUserToList', function (email, list, callback) {
      callback();
    });
    unsubscribeSpy = sinon.stub(sympaStub, 'removeUserFromList', function (email, list, callback) {
      callback();
    });
    done();
  });

  afterEach(function (done) {
    sympaStub.addUserToList.restore();
    sympaStub.removeUserFromList.restore();
    sympaStub.getSubscribedListsForUser.restore();
    done();
  });

  var setupSubscribedListsForUser = function (lists) {
    sinon.stub(sympaStub, 'getSubscribedListsForUser', function (email, callback) {
      callback(null, lists);
    });
  };

  it('subscribes and unsubscribes no lists if both old and new subscription lists are empty', function (done) {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', [], function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('subscribes and unsubscribes no lists if old list contains one element and new subscription is the same element (not list)', function (done) {
    setupSubscribedListsForUser(['list1']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', 'list1', function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('subscribes list for new mail address and unsubscribes same list for old mail address if old and new mail addresses differ', function (done) {
    setupSubscribedListsForUser(['list1']);

    systemUnderTest.updateSubscriptions('user-new@mail.com', 'user-old@mail.com', 'list1', function (err) {

      expect(subscribeSpy.calledOnce, 'subscribe is called once').to.be.true;
      expect(subscribeSpy.calledWith('user-new@mail.com', 'list1'), 'list1 is subscribed with address user-new@mail.com').to.be.true;
      expect(unsubscribeSpy.calledOnce, 'unsubscribe is called once').to.be.true;
      expect(unsubscribeSpy.calledWith('user-old@mail.com', 'list1'), 'list1 is unsubscribed with address user-old@mail.com').to.be.true;

      done(err);
    });
  });

  it('subscribes and unsubscribes no lists if old and new subscription lists contain the same lists', function (done) {
    setupSubscribedListsForUser(['list1', 'list2']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', ['list1', 'list2'], function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('subscribes one list if old subscriptions are empty and new ones contain one listname (not array)', function (done) {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', 'list1', function (err) {

      expect(subscribeSpy.calledOnce, 'subscribe is called once').to.be.true;
      expect(subscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('subscribes one list if old subscriptions are empty and new ones contain one listname in an array', function (done) {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', ['list1'], function (err) {

      expect(subscribeSpy.calledOnce, 'subscribe is called once').to.be.true;
      expect(subscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('unsubscribes one list if old subscriptions contain a list and new ones are undefined', function (done) {
    setupSubscribedListsForUser(['list1']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', undefined, function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.calledOnce, 'unsubscribe is called once').to.be.true;
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;

      done(err);
    });
  });

  it('unsubscribes one list if old subscriptions contain a list and new ones are an empty array', function (done) {
    setupSubscribedListsForUser(['list1']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', [], function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.calledOnce, 'unsubscribe is called once').to.be.true;
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;

      done(err);
    });
  });

  it('subscribes and unsubscribes appropriately if there are many changes', function (done) {
    setupSubscribedListsForUser(['list1', 'list2', 'list3']);

    systemUnderTest.updateSubscriptions('user@mail.com', 'user@mail.com', ['list2', 'list4', 'list5'], function (err) {

      expect(subscribeSpy.calledTwice, 'subscribe is called twice').to.be.true;
      expect(unsubscribeSpy.calledTwice, 'unsubscribe is called twice').to.be.true;
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list3')).to.be.true;
      expect(subscribeSpy.calledWith('user@mail.com', 'list4')).to.be.true;
      expect(subscribeSpy.calledWith('user@mail.com', 'list5')).to.be.true;

      done(err);
    });
  });

  it('subscribes and unsubscribes appropriately if there are many changes and the email addresses differ', function (done) {
    setupSubscribedListsForUser(['list1', 'list2', 'list3']);

    systemUnderTest.updateSubscriptions('user-new@mail.com', 'user-old@mail.com', ['list2', 'list4', 'list5'], function (err) {

      expect(subscribeSpy.calledThrice, 'subscribe is called thrice').to.be.true;
      expect(unsubscribeSpy.calledThrice, 'unsubscribe is called thrice').to.be.true;
      expect(unsubscribeSpy.calledWith('user-old@mail.com', 'list1')).to.be.true;
      expect(unsubscribeSpy.calledWith('user-old@mail.com', 'list2')).to.be.true;
      expect(unsubscribeSpy.calledWith('user-old@mail.com', 'list3')).to.be.true;
      expect(subscribeSpy.calledWith('user-new@mail.com', 'list2')).to.be.true;
      expect(subscribeSpy.calledWith('user-new@mail.com', 'list4')).to.be.true;
      expect(subscribeSpy.calledWith('user-new@mail.com', 'list5')).to.be.true;

      done(err);
    });
  });

});

describe('Groups API (updateAdminListSubscription)', function () {

  var subscribeSpy;
  var unsubscribeSpy;

  var adminList = conf.get('adminListName');

  beforeEach(function (done) {
    systemUnderTest.refreshCache();
    subscribeSpy = sinon.stub(sympaStub, 'addUserToList', function (email, list, callback) {
      callback();
    });
    unsubscribeSpy = sinon.stub(sympaStub, 'removeUserFromList', function (email, list, callback) {
      callback();
    });
    done();
  });

  afterEach(function (done) {
    sympaStub.addUserToList.restore();
    sympaStub.removeUserFromList.restore();
    sympaStub.getSubscribedListsForUser.restore();
    done();
  });

  var setupSubscribedListsForUser = function (lists) {
    sinon.stub(sympaStub, 'getSubscribedListsForUser', function (email, callback) {
      callback(null, lists);
    });
  };

  it('subscribes to admin list if admin and not already subscribed', function (done) {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateAdminListSubscription('user@mail.com', true, function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.true;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('does not subscribe to admin list if admin and already subscribed', function (done) {
    setupSubscribedListsForUser([adminList]);

    systemUnderTest.updateAdminListSubscription('user@mail.com', true, function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('unsubscribes to admin list if not admin and already subscribed', function (done) {
    setupSubscribedListsForUser([adminList]);

    systemUnderTest.updateAdminListSubscription('user@mail.com', false, function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.true;

      done(err);
    });
  });

  it('does not unsubscribe to admin list if not admin and already unsubscribed', function (done) {
    setupSubscribedListsForUser([]);

    systemUnderTest.updateAdminListSubscription('user@mail.com', false, function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('neither subscribes or unsubscribes anything does if admin subscription has correct state (false)', function (done) {
    setupSubscribedListsForUser(['a', 'b', 'c']);

    systemUnderTest.updateAdminListSubscription('user@mail.com', false, function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

  it('neither subscribes or unsubscribes anything does if admin subscription has correct state (true)', function (done) {
    setupSubscribedListsForUser(['a', 'b', 'c', adminList]);

    systemUnderTest.updateAdminListSubscription('user@mail.com', true, function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      done(err);
    });
  });

});

describe('Groups API (combineSubscribedAndAvailableGroups)', function () {

  it('combines no subscribed and no available groups to an empty array', function (done) {
    var result = systemUnderTest.combineSubscribedAndAvailableGroups([], []);

    expect(result).to.be.not.null;
    expect(result.length).to.equal(0);
    done();
  });

  it('combines some subscribed but no available groups to an empty array', function (done) {
    var result = systemUnderTest.combineSubscribedAndAvailableGroups([GroupA, GroupB], []);

    expect(result).to.be.not.null;
    expect(result.length).to.equal(0);
    done();
  });

  it('combines no subscribed and one available group to indicate an unselected group', function (done) {
    var result = systemUnderTest.combineSubscribedAndAvailableGroups([], [GroupA]);

    expect(result).to.be.not.null;
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be.false;
    done();
  });

  it('combines one subscribed and another available group to indicate an unselected group', function (done) {
    var result = systemUnderTest.combineSubscribedAndAvailableGroups([GroupA], [GroupB]);

    expect(result).to.be.not.null;
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupB);
    expect(result[0].selected, 'selected').to.be.false;
    done();
  });

  it('combines one subscribed and the same available group to indicate a selected group', function (done) {
    var result = systemUnderTest.combineSubscribedAndAvailableGroups([GroupA], [GroupA]);

    expect(result).to.be.not.null;
    expect(result.length).to.equal(1);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be.true;
    done();
  });

  it('combines some subscribed and some available groups to indicate the correct selections', function (done) {
    var result = systemUnderTest.combineSubscribedAndAvailableGroups([GroupA], [GroupA, GroupB]);

    expect(result).to.be.not.null;
    expect(result.length).to.equal(2);
    expect(result[0].group, 'group').to.equal(GroupA);
    expect(result[0].selected, 'selected').to.be.true;
    expect(result[1].group, 'group').to.equal(GroupB);
    expect(result[1].selected, 'selected').to.be.false;
    done();
  });
});
