"use strict";

var path = require('path');
module.exports = function (app, conf) {

  var userCommons = require('../commons/userCommons');
  var membersAPI = require('../members/membersAPI')(conf);
  var groups = require('../groups/groupsAPI')(conf);
  var Group = require('../groups/group');

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
    membersAPI.updateMembersFieldWith(nickname, field, value, function (successful) {
      if (successful) {
        return res.send(200, "OK");
      }
      res.send(500, "Could not save");
    });
  });

  app.get('/groupTable', function (req, res, next) {
    userCommons.redirectIfNotAdmin(req, res, function () {
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          return next(err);
        } else {
          res.render('groupTable', { groups: groups, groupTypes: new Group().allTypes() });
        }
      });
    });
  });

  app.post('/groupChanged', function (req, res) {
    var value = req.body.value;
    var field = req.body.name;
    var id = req.body.pk;
    groups.updateGroupsFieldWith(id, field, value, function (successful) {
      if (successful) {
        return res.send(200, "OK");
      }
      res.send(500, "Could not save");
    });
  });

  return app;
};
