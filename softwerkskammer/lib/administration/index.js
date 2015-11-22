'use strict';

var async = require('async');
var _ = require('lodash');

var beans = require('simple-configure').get('beans');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitystore = beans.get('activitystore');
var activitiesService = beans.get('activitiesService');
var announcementstore = beans.get('announcementstore');
var misc = beans.get('misc');
var Group = beans.get('group');

var app = misc.expressAppIn(__dirname);

app.get('/memberTable', function (req, res, next) {
  memberstore.allMembers(function (err, members) {
    if (err) { return next(err); }
    memberstore.socratesOnlyMembers(function(err1, socMembers) {
      if (err1) { return next(err1); }
      res.render('memberTable', { members: _.union(members, socMembers) });
    });
  });
});

app.get('/memberAndGroupTable', function (req, res, next) {
  async.parallel(
    {
      groups: groupsService.getAllAvailableGroups,
      membersAndInfo: groupsAndMembersService.getAllMembersWithTheirGroups
    },
    function (err, results) {
      if (err) { return next(err); }
      res.render('memberAndGroupTable', {members: results.membersAndInfo[0], groupsWithExtraEmailAddresses: results.membersAndInfo[1], groups: results.groups});
    }
  );
});

app.get('/groupTable', function (req, res, next) {
  groupsService.getAllAvailableGroups(function (err, groups) {
    if (err) { return next(err); }
    res.render('groupTable', { groups: groups, groupTypes: Group.allTypes() });
  });
});

app.get('/activityTable', function (req, res, next) {
  return activitiesService.getActivitiesForDisplay(activitystore.allActivities, function (err, activities) {
    if (err) { return next(err); }
    res.render('activityTable', { activities: activities});
  });
});

app.get('/announcementTable', function (req, res, next) {
  announcementstore.allAnnouncements(function (err, announcements) {
    if (err) { return next(err); }
    res.render('announcementTable', { announcements: announcements });
  });
});

app.get('/interests', function (req, res, next) {
  memberstore.allMembers(function (err, members) {
    if (err || !members) { return next(err); }
    res.render('interests', { interests: membersService.toUngroupedWordList(members) });
  });
});

module.exports = app;
