"use strict";

var path = require('path');
var conf = require('nconf');

module.exports = function (app) {

  var userCommons = conf.get('beans').get('userCommons');
  var membersAPI = conf.get('beans').get('membersAPI');
  var groupsAPI = conf.get('beans').get('groupsAPI');
  var activityAPI = require('../activities/activitiesAPI');
  var Group = conf.get('beans').get('group');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/memberTable', function (req, res, next) {
    userCommons.redirectIfNotAdmin(req, res, function () {
      membersAPI.allMembers(function (err, members) {
        if (err) {
          return next(err);
        }
        res.render('memberTable', { members: members });
      });
    });
  });

  app.post('/memberChanged', function (req, res) {
    var value = req.body.value;
    var field = req.body.name;
    var nickname = req.body.pk;
    membersAPI.updateMembersFieldWith(nickname, field, value, function (successful, errors) {
      if (successful) {
        return res.send(200, "OK");
      }
      res.send(500, errors.join(', '));
    });
  });

  app.get('/groupTable', function (req, res, next) {
    userCommons.redirectIfNotAdmin(req, res, function () {
      groupsAPI.getAllAvailableGroups(function (err, groups) {
        if (err) {
          return next(err);
        }
        res.render('groupTable', { groups: groups, groupTypes: new Group().allTypes() });
      });
    });
  });

  app.post('/groupChanged', function (req, res) {
    var value = req.body.value;
    var field = req.body.name;
    var id = req.body.pk;
    groupsAPI.updateGroupsFieldWith(id, field, value, function (successful, errors) {
      if (successful) {
        return res.send(200, "OK");
      }
      res.send(500, errors.join(', '));
    });
  });

  app.get('/activityTable', function (req, res, next) {
    userCommons.redirectIfNotAdmin(req, res, function () {
      activityAPI.allActivities(function (err, activities) {
        if (err) {
          return next(err);
        }
        groupsAPI.getAllAvailableGroups(function (err, groups) {
          res.render('activityTable', { activities: activities, groups: groups});
        });
      });
    });
  });

  app.post('/activityChanged', function (req, res) {
    var value = req.body.value;
    var field = req.body.name;
    var id = req.body.pk;
    activityAPI.updateActivityFieldWith(id, field, value, function (successful, errors) {
      if (successful) {
        return res.send(200, "OK");
      }
      res.send(500, errors.join(', '));
    });
  });

  return app;
};
