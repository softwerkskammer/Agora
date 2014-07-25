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
var colorstore = beans.get('colorstore');
var Color = beans.get('color');
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

app.get('/colors', function (req, res, next) {
  colorstore.allColors(function (err, colors) {
    if (err) { return next(err); }
    res.render('colors', { colors: colors });
  });
});

app.post('/submitColors', function (req, res, next) {
  var colors = [];
  _.forIn(req.body, function (value, key) {
    if (key !== '_csrf') {
      colors.push(new Color({id: key, color: value}));
    }
  });
  colorstore.saveColors(colors, function (err) {
    if (err) { return next(err); }
    statusmessage.successMessage('message.title.save_successful', 'message.content.colors.saved').putIntoSession(req);
    res.redirect('/administration/colors');
  });
});

app.post('/submitNewColor', function (req, res, next) {
  colorstore.saveColor(new Color(req.body), function (err) {
    if (err) { return next(err); }
    statusmessage.successMessage('message.title.save_successful', 'message.content.colors.saved_single').putIntoSession(req);
    res.redirect('/administration/colors');
  });
});

app.get('/announcementTable', function (req, res, next) {
  announcementstore.allAnnouncements(function (err, announcements) {
    if (err) { return next(err); }
    res.render('announcementTable', { announcements: announcements });
  });
});

module.exports = app;
