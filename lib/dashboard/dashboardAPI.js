"use strict";

var conf = require('nconf');
var beans = conf.get('beans');
var async = require('async');
var _ = require('lodash');
var moment = require('moment-timezone');

var wikiAPI = beans.get('wikiAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var activitiesAPI = beans.get('activitiesAPI');
var mailarchiveAPI = conf.get('beans').get('mailarchiveAPI');

module.exports = {

  dataForDashboard: function (nickname, callback) {
    groupsAndMembersAPI.getUserWithHisGroups(nickname, function (err, member) {
      if (err) { return callback(err); }
      if (!member) { return callback(new Error('no member found')); }
      activitiesAPI.getUpcomingActivitiesOfMemberAndHisGroups(member, function (err, activities) {
        if (err) { return callback(err); }
        var postsByGroup = {};
        var changesByGroup = {};
        var mailsByGroup = {};
        async.each(member.subscribedGroups || [], function (group, callback) {
          wikiAPI.getBlogpostsForGroup(group.id, function (err, blogposts) {
            if (err) { return callback(err); }
            postsByGroup[group.id] = blogposts;
            wikiAPI.listChangedFilesinDirectory(group.id, function (err, metadatas) {
              if (err) { return callback(err); }
              changesByGroup[group.id] = metadatas;
              mailarchiveAPI.unthreadedMails(group.id, function (err, mails) {
                var oneMonthAgo = moment().subtract('months', 8);
                mailsByGroup[group.id] = _.filter(mails, function (mail) {
                  return mail.time.isAfter(oneMonthAgo);
                });
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
            mailsByGroup: mailsByGroup
          });
        });
      });
    });
  }

};
