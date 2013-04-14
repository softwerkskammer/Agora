"use strict";

var path = require('path'),
  winston = require('winston');

module.exports = function (app, conf) {
  var logger = winston.loggers.get('application');

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
      res.redirect(urlPrefix + '/groups/');
    }
  }

  // display all groups
  app.get('/', function (req, res) {
    groups.getAllAvailableGroups(function (err, groups) {
      if (err) {
        logger.error("Error: " + err);
      } else {
        res.render('index', {groups: groups});
      }
    });
  });

  app.get('/new', function (req, res) {
    redirectIfNotAdmin(req, res, function () {
      res.render('edit', { group: new Group() });
    });
  });

  app.post('/submit', function (req, res, next) {
    redirectIfNotAdmin(req, res, function () {
      groupSubmitted(req, res, next);
    });
  });

  app.post('/edit/submit', function (req, res, next) {
    redirectIfNotAdmin(req, res, function () {
      groupSubmitted(req, res, next);
    });
  });

  // the parameterized routes must come after the fixed ones!

  app.get('/edit/:groupname', function (req, res, next) {
    redirectIfNotAdmin(req, res, function () {
      groups.getGroup(req.params.groupname, function (err, group) {
        if (err) {
          return next(err);
        }
        res.render('edit', { group: group ? group : new Group()});
      });
    });
  });

  app.get('/checkgroupname', function (req, res) {
    var groupname = req.query.id;
    groups.isGroupNameAvailable(groupname, function (err, result) {
      if (err) {
        return res.end('false');
      }
      res.end(result.toString());
    });
  });

  var redirectIfNotAdmin = function (req, res, callback) {
    if (!userIsRegistered(req) || !req.user.member.isAdmin) {
      return res.redirect(urlPrefix + '/groups/' + (req.params.groupname ? req.params.groupname : ''));
    }
    callback();
  };

  app.get('/subscribe/:groupname', function (req, res, next) {
    if (userIsRegistered(req)) {
      return groups.addUserToList(req.user.member.email, req.params.groupname, function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(urlPrefix + '/groups/' + req.params.groupname);
      });
    }
    res.redirect(urlPrefix + '/groups/' + req.params.groupname);
  });

  app.get('/unsubscribe/:groupname', function (req, res, next) {
    if (userIsRegistered(req)) {
      return groups.removeUserFromList(req.user.member.email, req.params.groupname, function (err) {
        if (err) {
          return next(err);
        }
        res.redirect(urlPrefix + '/groups/' + req.params.groupname);
      });
    }
    res.redirect(urlPrefix + '/groups/' + req.params.groupname);
  });

  var userIsRegistered = function (req) {
    return req && req.user && req.user.member;
  };

  var registeredUserId = function (req) {
    return req && req.user ? req.user.identifier : undefined;
  };

  app.get('/administration', function (req, res, next) {
    redirectIfNotAdmin(req, res, function () {
      groups.getAllAvailableGroups(function (err, groups) {
        if (err) {
          logger.error("Error: " + err);
          next(err);
        } else {
          res.render('administration', { groups: groups });
        }
      });
    });
  });

  app.post('/administration', function (req, res) {
    var value = req.body.value;
    var field = req.body.name;
    var id = req.body.pk;
    groups.getGroup(id, function (err, result) {
      result[field] = value;
      groups.createOrSaveGroup(result, function (err, result) {
        if (err || !result) {
          return res.send(500, "Could not save");
        }
        res.send(200, "OK");
      });
    });
  });

  app.get('/:groupname', function (req, res) {
    groupsAndMembers.getGroupAndUsersOfList(req.params.groupname, function (err, group, users) {
      if (err) {
        logger.error("Error: " + err);
      } else {
        res.render('get', {group: group, users: users,
          userIsRegistered: userIsRegistered(req),
          userIsGroupMember: groupsAndMembers.userIsInMemberList(registeredUserId(req), users) });
      }
    });
  });

  return app;
};
