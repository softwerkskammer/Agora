/*global describe, it */
"use strict";
var proxyquire = require('proxyquire');

var expect = require('chai').expect;

var Group = require('../lib/groups/group');

var GroupA = new Group('GroupA', 'Gruppe A', 'Dies ist Gruppe A.', 'Themengruppe');
var GroupB = new Group('GroupB', 'Gruppe B', 'Dies ist Gruppe B.', 'Regionalgruppe');

var groupstoreStub = {
  allGroups: function (callback) { callback(null, [GroupA, GroupB]); },
  getGroup: function (name, callback) {
    if (name === 'GroupA@softwerkskammer.de') {
      callback(null, GroupA);
    } else if (name === 'GroupB@softwerkskammer.de') {
      callback(null, GroupB);
    } else {
      callback(null, null);
    }
  }
};

var sympaStub = {
  getSubscribedListsForUser: function () {},
  getAllAvailableLists: function () {},
  getUsersOfList: function () {}
};



var groupsAPI = proxyquire('../lib/groups/internalAPI', {
  './groupstore': function () { return groupstoreStub; },
  './sympaStub': function () { return sympaStub; }
});

var systemUnderTest = groupsAPI({ get: function () { return null; } });   // empty config -> sympaStub is required

describe('Groups internal API', function () {

  it('returns an empty array of groups for a user who is not subscribed anywhere', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, []); };

    systemUnderTest.getSubscribedListsForUser('me@bla.com', function (err, validLists) {
      expect(err).to.be.null;
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(0);
      done();
    });
  });

  it('returns one group for a user who is subscribed to one list', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) { callback(null, [{ listAddress: 'GroupA@softwerkskammer.de' }]); };

    systemUnderTest.getSubscribedListsForUser('GroupAuser@softwerkskammer.de', function (err, validLists) {
      expect(err).to.be.null;
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(1);
      expect(validLists[0]).to.equal(GroupA);
      done();
    });
  });

  it('returns two groups for a user who is subscribed to two lists', function (done) {
    sympaStub.getSubscribedListsForUser = function (email, callback) {
      callback(null, [{ listAddress: 'GroupA@softwerkskammer.de' }, { listAddress: 'GroupB@softwerkskammer.de' }]);
    };

    systemUnderTest.getSubscribedListsForUser('GroupAandBuser@softwerkskammer.de', function (err, validLists) {
      expect(err).to.be.null;
      expect(validLists).to.not.be.null;
      expect(validLists.length).to.equal(2);
      expect(validLists[0]).to.equal(GroupA);
      expect(validLists[1]).to.equal(GroupB);
      done();
    });
  });

  it('returns an empty array of groups if there are no lists defined in sympa', function (done) {
    sympaStub.getAllAvailableLists = function (callback) { callback(null, []); };

    systemUnderTest.getAllAvailableLists(function (err, lists) {
      expect(err).to.be.null;
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(0);
      done();
    });
  });

  it('returns an empty array of groups if there is one list defined in sympa but there is no matching group in Softwerkskammer', function (done) {
    sympaStub.getAllAvailableLists = function (callback) { callback(null, [{ listAddress: 'unknownGroup@softwerkskammer.de' }]); };

    systemUnderTest.getAllAvailableLists(function (err, lists) {
      expect(err).to.be.null;
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(0);
      done();
    });
  });

  it('returns one group if there are two lists defined in sympa and there is one matching group in Softwerkskammer', function (done) {
    sympaStub.getAllAvailableLists = function (callback) { callback(null, [{ listAddress: 'GroupA@softwerkskammer.de' }, { listAddress: 'unknownGroup@softwerkskammer.de' }]); };

    systemUnderTest.getAllAvailableLists(function (err, lists) {
      expect(err).to.be.null;
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(1);
      expect(lists[0]).to.equal(GroupA);
      done();
    });
  });

  it('returns two groups if there are two lists defined in sympa and there are two matching groups in Softwerkskammer', function (done) {
    sympaStub.getAllAvailableLists = function (callback) { callback(null, [{ listAddress: 'GroupA@softwerkskammer.de' }, { listAddress: 'GroupB@softwerkskammer.de' }]); };

    systemUnderTest.getAllAvailableLists(function (err, lists) {
      expect(err).to.be.null;
      expect(lists).to.not.be.null;
      expect(lists.length).to.equal(2);
      expect(lists[0]).to.equal(GroupA);
      expect(lists[1]).to.equal(GroupB);
      done();
    });
  });


  /*
    it('shows the details of one members as retrieved from the membersstore', function (done) {
      var nickname = dummymember.nickname,
        email = dummymember.email,
        getMember = sinon.spy(membersInternalAPIStub, 'getMember'),
        getSubscribedListsForUser = sinon.spy(groupsInternalAPIStub, 'getSubscribedListsForUser');
      request(app)
        .get('/' + nickname)
        .expect(200)
        .expect(/Blog: http:\/\/my.blog/)
        .expect(/Wie ich von der Softwerkskammer erfahren habe: beim Bier/, function () {
          getMember.calledWith(nickname).should.be.true;
          getSubscribedListsForUser.calledWith(email).should.be.true;
          done();
        });
    });
    */
});
