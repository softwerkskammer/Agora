"use strict";

var path = require('path'),
  winston = require('winston');

module.exports = function (app, conf) {
  var logger = winston.loggers.get('application');

  var groups = require('./groupsAPI')(conf);
  var Group = require('./group');
  var groupsAndMembers = require('../groupsAndMembers/groupsAndMembersAPI')(conf);

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function groupSubmitted(req, res, next) {
    var group = new Group().fromObject(req.body);
    if (group.isValid()) {
      groups.saveGroup(group, function (err) {
        if (err) {
          return next(err);
        }
        res.render('get', {group: group, users: []});
      });
    } else {
      res.render('edit', { group: group});
    }
  }


  // display all groups
  app.get('/', function (req, res) {
    var responseCallback = function (err, groups) {
      if (err) {
        logger.error("Error: " + err);
      } else {
        logger.info('parse index');
        res.render('index', {title: 'Alle Gruppen', groups: groups});
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
        res.render('get', {group: group, users: users});
      }
    };

    groupsAndMembers.getGroupAndUsersOfList(req.params.groupname, responseCallback);
  });

  app.get('/edit/:groupname', function (req, res, next) {
    groups.getGroup(req.params.groupname, function (err, group) {
      if (err) {
        return next(err);
      }
      res.render('edit', { group: group ? group : new Group()});
    });
  });

  app.post('/edit/submit', function (req, res, next) {
    groupSubmitted(req, res, next);
  });


  return app;
};
