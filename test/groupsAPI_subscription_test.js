/*global describe, it */
"use strict";
var proxyquire = require('proxyquire'),
  sinon = require('sinon');

var expect = require('chai').expect;


var groupstoreStub = {
};

var sympaStub = {
  getSubscribedListsForUser: function () {},
  addUserToList: function (email, list, callback) { callback(); },
  removeUserFromList: function (email, list, callback) { callback(); }
};



var groupsAPI = proxyquire('../lib/groups/groupsAPI', {
  './groupstore': function () { return groupstoreStub; },
  './sympaStub': function () { return sympaStub; }
});

var systemUnderTest = groupsAPI({ get: function () { return null; } });   // empty config -> sympaStub is required

describe('Groups API (Subscriptions)', function () {

  it('subscribes and unsubscribes no lists if both old and new subscription lists are empty', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, []); };
    var subscribeSpy = sinon.spy(sympaStub, 'addUserToList');
    var unsubscribeSpy = sinon.spy(sympaStub, 'removeUserFromList');


    systemUnderTest.updateSubscriptions('user@mail.com', [], function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      sympaStub.addUserToList.restore();
      sympaStub.removeUserFromList.restore();

      done(err);
    });
  });

  it('subscribes and unsubscribes no lists if old list contains one element and new subscription is the same element (not list)', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, ['list1']); };
    var subscribeSpy = sinon.spy(sympaStub, 'addUserToList');
    var unsubscribeSpy = sinon.spy(sympaStub, 'removeUserFromList');


    systemUnderTest.updateSubscriptions('user@mail.com', 'list1', function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      sympaStub.addUserToList.restore();
      sympaStub.removeUserFromList.restore();

      done(err);
    });
  });

  it('subscribes and unsubscribes no lists if old and new subscription lists contain the same lists', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, ['list1', 'list2']); };
    var subscribeSpy = sinon.spy(sympaStub, 'addUserToList');
    var unsubscribeSpy = sinon.spy(sympaStub, 'removeUserFromList');


    systemUnderTest.updateSubscriptions('user@mail.com', ['list1', 'list2'], function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      sympaStub.addUserToList.restore();
      sympaStub.removeUserFromList.restore();

      done(err);
    });
  });

  it('subscribes one list if old subscriptions are empty and new ones contain one element (not list)', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, []); };
    var subscribeSpy = sinon.spy(sympaStub, 'addUserToList');
    var unsubscribeSpy = sinon.spy(sympaStub, 'removeUserFromList');


    systemUnderTest.updateSubscriptions('user@mail.com', 'list1', function (err) {

      expect(subscribeSpy.calledOnce, 'subscribe is called once').to.be.true;
      expect(subscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      sympaStub.addUserToList.restore();
      sympaStub.removeUserFromList.restore();

      done(err);
    });
  });

  it('subscribes one list if old subscriptions are empty and new ones contain one list', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, []); };
    var subscribeSpy = sinon.spy(sympaStub, 'addUserToList');
    var unsubscribeSpy = sinon.spy(sympaStub, 'removeUserFromList');


    systemUnderTest.updateSubscriptions('user@mail.com', ['list1'], function (err) {

      expect(subscribeSpy.calledOnce, 'subscribe is called once').to.be.true;
      expect(subscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;
      expect(unsubscribeSpy.called, 'unsubscribe is called').to.be.false;

      sympaStub.addUserToList.restore();
      sympaStub.removeUserFromList.restore();

      done(err);
    });
  });

  it('unsubscribes one list if old subscriptions contain a list and new ones are undefined', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, ['list1']); };
    var subscribeSpy = sinon.spy(sympaStub, 'addUserToList');
    var unsubscribeSpy = sinon.spy(sympaStub, 'removeUserFromList');


    systemUnderTest.updateSubscriptions('user@mail.com', undefined, function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.calledOnce, 'unsubscribe is called once').to.be.true;
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;

      sympaStub.addUserToList.restore();
      sympaStub.removeUserFromList.restore();

      done(err);
    });
  });

  it('unsubscribes one list if old subscriptions contain a list and new ones are an empty array', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, ['list1']); };
    var subscribeSpy = sinon.spy(sympaStub, 'addUserToList');
    var unsubscribeSpy = sinon.spy(sympaStub, 'removeUserFromList');


    systemUnderTest.updateSubscriptions('user@mail.com', [], function (err) {

      expect(subscribeSpy.called, 'subscribe is called').to.be.false;
      expect(unsubscribeSpy.calledOnce, 'unsubscribe is called once').to.be.true;
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;

      sympaStub.addUserToList.restore();
      sympaStub.removeUserFromList.restore();

      done(err);
    });
  });

  it('subscribes and unsubscribes appropriately if there are many changes', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, ['list1', 'list2', 'list3']); };
    var subscribeSpy = sinon.spy(sympaStub, 'addUserToList');
    var unsubscribeSpy = sinon.spy(sympaStub, 'removeUserFromList');


    systemUnderTest.updateSubscriptions('user@mail.com', ['list2', 'list4', 'list5'], function (err) {

      expect(subscribeSpy.calledTwice, 'subscribe is called twice').to.be.true;
      expect(unsubscribeSpy.calledTwice, 'unsubscribe is called twice').to.be.true;
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list1')).to.be.true;
      expect(unsubscribeSpy.calledWith('user@mail.com', 'list3')).to.be.true;
      expect(subscribeSpy.calledWith('user@mail.com', 'list4')).to.be.true;
      expect(subscribeSpy.calledWith('user@mail.com', 'list5')).to.be.true;

      sympaStub.addUserToList.restore();
      sympaStub.removeUserFromList.restore();

      done(err);
    });
  });
});
