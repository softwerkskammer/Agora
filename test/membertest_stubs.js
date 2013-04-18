"use strict";
var proxyquire = require('proxyquire');

var Member = require('../lib/members/member');

var dummymember = new Member();
dummymember.nickname = 'hada';
dummymember.site = 'http://my.blog';
dummymember.firstname = 'Hans';
dummymember.lastname = 'Dampf';

var groupsAPIStub = {
  getSubscribedGroupsForUser: function (email, callback) {
    callback(null, []);
  }
};

// disabling authentication
var ensureLoggedInStub = {
  ensureLoggedIn: function () {
    return function (req, res, next) {
      next();
    };
  }
};

var membersAPIStub = {
  allMembers: function (callback) {
    callback(null, [dummymember]);
  },
  getMember: function (nickname, callback) {
    callback(null, dummymember);
  }
};

var groupsAndMembers = proxyquire('../lib/groupsAndMembers/groupsAndMembersAPI', {
  '../groups/groupsAPI': function () {
    return groupsAPIStub;
  },
  '../members/membersAPI': function () {
    return membersAPIStub;
  }
});

var memberModule = proxyquire('../lib/members', {
  './membersAPI': function () {
    return membersAPIStub;
  },
  '../groupsAndMembers/groupsAndMembersAPI': groupsAndMembers,
  'connect-ensure-login': ensureLoggedInStub
});

module.exports = {
  dummymember: dummymember,
  membersAPIStub: membersAPIStub,
  groupsAPIStub: groupsAPIStub,
  memberModule: memberModule
};
