'use strict';

var beans = require('../../testutil/configureForTest').get('beans');

var sinon = require('sinon').sandbox.create();
var expect = require('must');

var moment = require('moment-timezone');

var wikiService = beans.get('wikiService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitiesService = beans.get('activitiesService');
var mailarchiveService = beans.get('mailarchiveService');

var dashboardService = beans.get('dashboardService');

describe('Dashboard Service', function () {
  var NOT_FOUND = 'notfound';
  var CRASH_ACTIVITY = 'crash activity';
  var member;
  var activity1;
  var activity2;

  beforeEach(function () {
    member = {membername: 'membername'};
    activity1 = {activity: 1};
    activity2 = {activity: 2};
    sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) {
      if (nickname === NOT_FOUND) {
        return callback(null, null);
      }
      if (nickname === CRASH_ACTIVITY) {
        return callback(null, CRASH_ACTIVITY);
      }
      callback(null, member);
    });
    sinon.stub(activitiesService, 'getUpcomingActivitiesOfMemberAndHisGroups', function (mem, callback) {
      if (mem === CRASH_ACTIVITY) {
        return callback(new Error());
      }
      callback(null, [activity1, activity2]);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('collects information from other Services when no subscribed groups exist', function (done) {
    dashboardService.dataForDashboard('nick', function (err, result) {
      expect(result.member).to.equal(member);
      expect(result.activities).to.contain(activity1);
      expect(result.activities).to.contain(activity2);
      expect(result.postsByGroup).to.be.empty();
      expect(result.changesByGroup).to.be.empty();
      expect(result.mailsByGroup).to.be.empty();
      done(err);
    });
  });

  it('handles the error when no member for nickname found', function (done) {
    dashboardService.dataForDashboard(NOT_FOUND, function (err) {
      expect(err).to.exist();
      done();
    });
  });

  it('handles the error when searching activities fails', function (done) {
    dashboardService.dataForDashboard(CRASH_ACTIVITY, function (err) {
      expect(err).to.exist();
      done();
    });
  });

  describe('wiki and mailarchive', function () {
    var CRASH_BLOG = 'crash blogs';
    var CRASH_CHANGE = 'crash changes';
    var CRASH_MAILS = 'crash mails';
    var blogs = ['blog1', 'blog2'];
    var changedFiles = ['change1', 'change2'];
    var mail1 = {name: 'mail1', time: moment()};
    var mail2 = {name: 'mail2', time: moment()};
    var veryOldMail = {name: 'mail3', time: moment().subtract(12, 'months')};
    var mails = [mail1, mail2];

    beforeEach(function () {
      sinon.stub(wikiService, 'getBlogpostsForGroup', function (groupid, callback) {
        if (groupid === CRASH_BLOG) {
          return callback(new Error());
        }
        callback(null, blogs);
      });
      sinon.stub(wikiService, 'listChangedFilesinDirectory', function (groupid, callback) {
        if (groupid === CRASH_CHANGE) {
          return callback(new Error());
        }
        callback(null, changedFiles);
      });
      sinon.stub(mailarchiveService, 'unthreadedMailsYoungerThan', function (groupid, age, callback) {
        if (groupid === CRASH_MAILS) {
          return callback(new Error());
        }
        callback(null, mails);
      });
    });

    it('collects wiki information', function (done) {
      member.subscribedGroups = [
        {id: 'group'}
      ];
      dashboardService.dataForDashboard('nick', function (err, result) {
        expect(result.postsByGroup).to.have.keys(['group']);
        expect(result.postsByGroup.group).to.contain('blog1');
        expect(result.postsByGroup.group).to.contain('blog2');
        expect(result.changesByGroup).to.have.keys(['group']);
        expect(result.changesByGroup.group).to.contain('change1');
        expect(result.changesByGroup.group).to.contain('change2');
        done(err);
      });
    });

    it('collects mail information, revoking old mails', function (done) {
      member.subscribedGroups = [
        {id: 'group'}
      ];
      dashboardService.dataForDashboard('nick', function (err, result) {
        expect(result.mailsByGroup).to.have.keys(['group']);
        expect(result.mailsByGroup.group).to.contain(mail1);
        expect(result.mailsByGroup.group).to.contain(mail2);
        expect(result.mailsByGroup.group).not.to.contain(veryOldMail);
        done(err);
      });
    });

    it('handles the error when searching blogposts crashes', function (done) {
      member.subscribedGroups = [
        {id: CRASH_BLOG}
      ];
      dashboardService.dataForDashboard('nick', function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('handles the error when searching wiki changes crashes', function (done) {
      member.subscribedGroups = [
        {id: CRASH_CHANGE}
      ];
      dashboardService.dataForDashboard('nick', function (err) {
        expect(err).to.exist();
        done();
      });
    });

    it('handles the error when searching wiki changes crashes', function (done) {
      member.subscribedGroups = [
        {id: CRASH_MAILS}
      ];
      dashboardService.dataForDashboard('nick', function (err) {
        expect(err).to.exist();
        done();
      });
    });

  });

  describe('partitions groups to columns by height', function () {
    it('for less than three groups', function () {
      var group1 = {id: 1};
      var group2 = {id: 2};
      var groups = [ group1, group2 ];
      var linesPerGroup = {1: 5, 2: 2};
      var result = dashboardService.groupsByColumns(groups, linesPerGroup);
      expect(result).to.have.length(3);
      expect(result[0]).to.contain(group1);
      expect(result[1]).to.contain(group2);
      expect(result[2]).to.be.empty();
    });

    it('for three groups of equal height', function () {
      var group1 = {id: 1};
      var group2 = {id: 2};
      var group3 = {id: 3};
      var groups = [ group1, group2, group3 ];
      var linesPerGroup = {1: 2, 2: 2, 3: 2};
      var result = dashboardService.groupsByColumns(groups, linesPerGroup);
      expect(result).to.have.length(3);
      expect(result[0]).to.contain(group1);
      expect(result[1]).to.contain(group2);
      expect(result[2]).to.contain(group3);
    });

    it('for three groups of different height (case 1)', function () {
      var group1 = {id: 1};
      var group2 = {id: 2};
      var group3 = {id: 3};
      var groups = [ group1, group2, group3 ];
      var linesPerGroup = {1: 3, 2: 2, 3: 1};
      var result = dashboardService.groupsByColumns(groups, linesPerGroup);
      expect(result).to.have.length(3);
      expect(result[0]).to.contain(group1);
      expect(result[1]).to.contain(group2);
      expect(result[2]).to.contain(group3);
    });

    it('for three groups of different height (case 2)', function () {
      var group1 = {id: 1};
      var group2 = {id: 2};
      var group3 = {id: 3};
      var groups = [ group1, group2, group3 ];
      var linesPerGroup = {1: 1, 2: 2, 3: 3};
      var result = dashboardService.groupsByColumns(groups, linesPerGroup);
      expect(result).to.have.length(3);
      expect(result[0]).to.contain(group1);
      expect(result[0]).to.contain(group2);
      expect(result[1]).to.contain(group3);
      expect(result[2]).to.be.empty();
    });
  });
});
