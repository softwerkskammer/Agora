/*global describe, it */
"use strict";
var proxyquire = require('proxyquire');

var expect = require('chai').expect;

var Member = require('../lib/members/member');

var dummymember = new Member('hada', 'Hans', 'Dampf', 'hans.dampf@gmail.com', '@hada', 'Süden', 'Entwickler', 'ada', 'http://my.blog', 'beim Bier');

var Group = require('../lib/groups/group');

var GroupA = new Group('GroupA', 'Gruppe A', 'Dies ist Gruppe A.', 'Themengruppe');
var GroupB = new Group('GroupB', 'Gruppe B', 'Dies ist Gruppe B.', 'Regionalgruppe');

var groupsInternalAPIStub = {
  getSubscribedGroupsForUser: function () {}
};

var membersInternalAPIStub = {
  getMember: function () {}
};

var groupsAndMembers = proxyquire('../lib/groupsAndMembers/internalAPI', {
  '../groups/internalAPI': function () { return groupsInternalAPIStub; },
  '../members/internalAPI': function () { return membersInternalAPIStub; }
});

var systemUnderTest = groupsAndMembers({ get: function () { return null; } });   // empty config -> sympaStub is required

describe('Groups and Members internal API', function () {

  it('returns null as member and no groups when there is no member for the given nickname', function (done) {
    membersInternalAPIStub.getMember = function (nickname, callback) {
      callback(null, null);
    };
    groupsInternalAPIStub.getSubscribedGroupsForUser = function (userMail, globalCallback) {
      globalCallback(null, []);
    };

    systemUnderTest.getUserWithHisGroups('nickname', function (member, subscribedLists) {
      expect(member).to.be.null;
      expect(subscribedLists).to.not.be.null;
      expect(subscribedLists.length).to.equal(0);
      done();
    });
  });

  it('returns the member and his groups when there is a member for the given nickname', function (done) {
    membersInternalAPIStub.getMember = function (nickname, callback) {
      callback(null, dummymember);
    };
    groupsInternalAPIStub.getSubscribedGroupsForUser = function (userMail, globalCallback) {
      globalCallback(null, [GroupA, GroupB]);
    };

    systemUnderTest.getUserWithHisGroups('nickname', function (member, subscribedGroups) {
      expect(member).to.equal(dummymember);
      expect(subscribedGroups).to.not.be.null;
      expect(subscribedGroups.length).to.equal(2);
      expect(subscribedGroups[0]).to.equal(GroupA);
      expect(subscribedGroups[1]).to.equal(GroupB);
      done();
    });
  });

/*
  it('shows the details of one members as retrieved from the membersstore', function (done) {
    var nickname = dummymember.nickname,
      email = dummymember.email,
      getMember = sinon.spy(membersInternalAPIStub, 'getMember'),
      getSubscribedGroupsForUser = sinon.spy(groupsInternalAPIStub, 'getSubscribedGroupsForUser');
    request(app)
      .get('/' + nickname)
      .expect(200)
      .expect(/Blog: http:\/\/my.blog/)
      .expect(/Wie ich von der Softwerkskammer erfahren habe: beim Bier/, function () {
        getMember.calledWith(nickname).should.be.true;
        getSubscribedGroupsForUser.calledWith(email).should.be.true;
        done();
      });
  });
  */
});
