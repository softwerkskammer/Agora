"use strict";

var path = require('path');

module.exports = function (app, conf) {

  var groups = require('./groupsAPI')(conf);
  var Group = require('./group');
  var groupsAndMembers = require('../groupsAndMembers/groupsAndMembersAPI')(conf);
  var urlPrefix = conf.get('publicUrlPrefix');

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');


  function groupSubmitted(req, res, next) {
    var group = groups.groupFromObject(req.body);
    if (group.isValid()) {
      groups.createOrSaveGroup(group, function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(urlPrefix + '/groups/' + group.id);
      });
    } else {
      res.redirect(urlPrefix + '/groups/edit/' + group.id);
    }
  }


  // display all groups
  app.get('/', function (req, res) {
    var responseCallback = function (err, groups) {
      if (err) {
        console.log("Error: " + err);
      } else {
        res.render('index', {title: 'Alle Gruppen', groups: groups});
      }
    };

    groups.getAllAvailableGroups(responseCallback);
  });

  app.get('/new', function (req, res) {
    res.render('edit', { group: new Group() });
  });

  app.post('/submit', function (req, res, next) {
    groupSubmitted(req, res, next);
  });

  app.post('/edit/submit', function (req, res, next) {
    groupSubmitted(req, res, next);
  });

  // the variable routes must come after the fixed ones!
  app.get('/edit/:groupname', function (req, res, next) {
    groups.getGroup(req.params.groupname, function (err, group) {
      if (err) {
        return next(err);
      }
      res.render('edit', { group: group ? group : new Group()});
    });
  });

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


  return app;
};
