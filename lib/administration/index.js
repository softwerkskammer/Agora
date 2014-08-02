'use strict';

var _ = require('lodash');
var async = require('async');

var beans = require('nconf').get('beans');
var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitystore = beans.get('activitystore');
var activitiesService = beans.get('activitiesService');
var announcementstore = beans.get('announcementstore');
var misc = beans.get('misc');
var Group = beans.get('group');
var statusmessage = beans.get('statusmessage');

var app = misc.expressAppIn(__dirname);

app.get('/memberTable', function (req, res, next) {
  memberstore.allMembers(function (err, members) {
    if (err) { return next(err); }
    res.render('memberTable', { members: members });
  });
});

app.get('/memberAndGroupTable', function (req, res, next) {
  async.parallel(
    {
      groups: groupsService.getAllAvailableGroups,
      members: groupsAndMembersService.getAllUsersWithTheirGroups
    },
    function (err, results) {
      if (err) { return next(err); }
      res.render('memberAndGroupTable', { members: results.members, groups: results.groups });
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

module.exports = app;
