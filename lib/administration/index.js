"use strict";

var path = require('path');
var _ = require('lodash');

module.exports = function (app) {

  var beans = require('nconf').get('beans');
  var memberstore = beans.get('memberstore');
  var groupsAPI = beans.get('groupsAPI');
  var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
  var activitystore = beans.get('activitystore');
  var activitiesAPI = beans.get('activitiesAPI');
  var announcementAPI = beans.get('announcementsAPI');
  var announcementstore = beans.get('announcementstore');
  var colorstore = beans.get('colorstore');
  var Color = beans.get('color');
  var Group = beans.get('group');
  var statusmessage = beans.get('statusmessage');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/memberTable', function (req, res, next) {
    memberstore.allMembers(function (err, members) {
      if (err) { return next(err); }
      res.render('memberTable', { members: members });
    });
  });

  app.get('/memberAndGroupTable', function (req, res, next) {
    groupsAPI.getAllAvailableGroups(function (err, groups) {
      if (err) { return next(err); }
      groupsAndMembersAPI.getAllUsersWithTheirGroups(function (err, members) {
        if (err) { return next(err); }
        res.render('memberAndGroupTable', { members: members, groups: groups });
      });
    });
  });

  app.get('/groupTable', function (req, res, next) {
    groupsAPI.getAllAvailableGroups(function (err, groups) {
      if (err) { return next(err); }
      res.render('groupTable', { groups: groups, groupTypes: Group.allTypes() });
    });
  });

  app.get('/activityTable', function (req, res, next) {
    return activitiesAPI.getActivitiesForDisplay(activitystore.allActivities, function (err, activities) {
      if (err) { next(err); }
      res.render('activityTable', { activities: activities});
    });
  });

  app.get('/colors', function (req, res, next) {
    colorstore.allColors(function (err, colors) {
      if (err) {
        return next(err);
      }
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
      if (err) {
        return next(err);
      }
      res.render('announcementTable', { announcements: announcements });
    });
  });

  // TODO does not work! Missing API method
  app.post('/announcementChanged', function (req, res) {
    announcementAPI.updateAnnouncementFieldWith(req.body.pk, req.body.name, req.body.value, function (successful, errors) {
      if (successful) { return res.send(200, "OK"); }
      res.send(500, errors.join(', '));
    });
  });

  return app;
};
