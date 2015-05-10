'use strict';

var beans = require('simple-configure').get('beans');
var async = require('async');
var _ = require('lodash');
var moment = require('moment-timezone');

var wikiService = beans.get('wikiService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitiesService = beans.get('activitiesService');
var mailarchiveService = beans.get('mailarchiveService');

function groupsByColumns(groups, linesPerGroup) {
  var result = [
    [],
    [],
    []
  ];
  var heightPerCol = _.reduce(linesPerGroup, function (sum, num) { return sum + num; }) / 3;
  var currentColHeight = 0;
  var currentCol = 0;
  _.each(groups, function (group) {
    result[currentCol].push(group);
    currentColHeight += linesPerGroup[group.id];
    if (currentColHeight >= heightPerCol) {
      currentCol = Math.min(currentCol + 1, 2);
      currentColHeight = 0;
    }
  });
  return result;
}

module.exports = {
  groupsByColumns: groupsByColumns,

  dataForDashboard: function (nickname, callback) {
    groupsAndMembersService.getMemberWithHisGroups(nickname, function (err, member) {
      if (err) { return callback(err); }
      if (!member) { return callback(new Error('no member found')); }
      activitiesService.getUpcomingActivitiesOfMemberAndHisGroups(member, function (err1, activities) {
        if (err1) { return callback(err1); }
        var basicHeight = 3;
        var basicHeightPerSection = 1;
        var postsByGroup = {};
        var changesByGroup = {};
        var mailsByGroup = {};
        var linesPerGroup = {};
        var oneMonthAgo = moment().subtract(1, 'months');
        async.each(member.subscribedGroups || [], function (group, cb) {
          linesPerGroup[group.id] = basicHeight;
          wikiService.getBlogpostsForGroup(group.id, function (err2, blogposts) {
            if (err2) { return cb(err2); }
            postsByGroup[group.id] = blogposts;
            linesPerGroup[group.id] = linesPerGroup[group.id] + basicHeightPerSection + blogposts.length;
            wikiService.listChangedFilesinDirectory(group.id, function (err3, metadatas) {
              if (err3) { return cb(err3); }
              changesByGroup[group.id] = metadatas;
              linesPerGroup[group.id] = linesPerGroup[group.id] + basicHeightPerSection + metadatas.length;
              mailarchiveService.unthreadedMailsYoungerThan(group.id, oneMonthAgo.unix(), function (err4, mails) {
                if (mails) {
                  mailsByGroup[group.id] = mails;
                  linesPerGroup[group.id] = linesPerGroup[group.id] + basicHeightPerSection + mails.length;
                }
                cb(err4);
              });
            });
          });
        }, function (err2) {
          callback(err2, {
            member: member,
            activities: activities,
            postsByGroup: postsByGroup,
            changesByGroup: changesByGroup,
            mailsByGroup: mailsByGroup,
            groupsPerColumn: groupsByColumns(member.subscribedGroups, linesPerGroup)
          });
        });
      });
    });
  }

};
