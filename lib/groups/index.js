"use strict";

var path = require('path');

module.exports = function (app, conf) {

  var groups = require('./groupsAPI')(conf);
  var groupsAndMembers = require('../groupsAndMembers/groupsAndMembersAPI')(conf);

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  // display all groups
  app.get('/', function (req, res) {
    var responseCallback = function (err, lists) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('index', {title: 'Alle Gruppen', lists: lists});
      }
    };

    groups.getAllAvailableGroups(responseCallback);
  });

  // display one group
  app.get('/:groupname', function (req, res) {
    var responseCallback = function (err, group, users) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('get', {title: 'Gruppe ', group: group, users: users});
      }
    };

    groupsAndMembers.getGroupAndUsersOfList(req.params.groupname, responseCallback);
  });

  return app;
};
