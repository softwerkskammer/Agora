"use strict";

var path = require('path');

module.exports = function (app, conf) {

  var membersAPI = require('../members/membersAPI')(conf);
  var groups = require('../groups/groupsAPI')(conf);
  var urlPrefix = conf.get('publicUrlPrefix');

  var userIsRegistered = function (req) {
    return req && req.user && req.user.member;
  };

  var redirectIfNotAdmin = function (req, res, callback) {
    if (!userIsRegistered(req) || !req.user.member.isAdmin) {
      return res.redirect(urlPrefix + '/');
    }
    callback();
  };

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/memberTable', function (req, res, next) {
    redirectIfNotAdmin(req, res, function () {
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
    redirectIfNotAdmin(req, res, function () {
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          return next(err);
        } else {
          res.render('groupTable', { groups: groups });
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
