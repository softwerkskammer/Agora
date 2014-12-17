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
    groupsAndMembersService.getUserWithHisGroups(nickname, function (err, member) {
      if (err) { return callback(err); }
      if (!member) { return callback(new Error('no member found')); }
      activitiesService.getUpcomingActivitiesOfMemberAndHisGroups(member, function (err, activities) {
        if (err) { return callback(err); }
        var basicHeight = 3;
        var basicHeightPerSection = 1;
        var postsByGroup = {};
        var changesByGroup = {};
        var mailsByGroup = {};
        var linesPerGroup = {};
        var oneMonthAgo = moment().subtract(1, 'months');
        async.each(member.subscribedGroups || [], function (group, callback) {
          linesPerGroup[group.id] = basicHeight;
          wikiService.getBlogpostsForGroup(group.id, function (err, blogposts) {
            if (err) { return callback(err); }
            postsByGroup[group.id] = blogposts;
            linesPerGroup[group.id] = linesPerGroup[group.id] + basicHeightPerSection + blogposts.length;
            wikiService.listChangedFilesinDirectory(group.id, function (err, metadatas) {
              if (err) { return callback(err); }
              changesByGroup[group.id] = metadatas;
              linesPerGroup[group.id] = linesPerGroup[group.id] + basicHeightPerSection + metadatas.length;
              mailarchiveService.unthreadedMailsYoungerThan(group.id, oneMonthAgo.unix(), function (err, mails) {
                if (mails) {
                  mailsByGroup[group.id] = mails;
                  linesPerGroup[group.id] = linesPerGroup[group.id] + basicHeightPerSection + mails.length;
                }
                callback(err);
              });
            });
          });
        }, function (err) {
          callback(err, {
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
