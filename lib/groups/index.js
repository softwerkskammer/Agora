"use strict";

var path = require('path');
var conf = require('nconf');

var groupsAPI = conf.get('beans').get('groupsAPI');
var Group = conf.get('beans').get('group');
var groupsAndMembers = conf.get('beans').get('groupsAndMembersAPI');

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function groupSubmitted(req, res, next) {
    var group = new Group(req.body);
    var errors = groupsAPI.isGroupValid(group);
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }
    groupsAPI.createOrSaveGroup(group, function (err) {
      if (err) { return next(err); }
      res.redirect('/groups/' + group.id);
    });
  }

  // display all groups
  app.get('/', function (req, res, next) {
    groupsAPI.getAllAvailableGroups(function (err, groups) {
      if (err) { return next(err); }
      var regionalgroups = groups.filter(function (group) { return group.type === group.allTypes()[1]; });
      var themegroups = groups.filter(function (group) { return group.type === group.allTypes()[0]; });
      res.render('index', {regionalgroups: regionalgroups, themegroups: themegroups});
    });
  });

  app.get('/new', function (req, res) {
    res.render('edit', { group: new Group() });
  });

  app.post('/submit', function (req, res, next) {
    groupSubmitted(req, res, next);
  });

  // the parameterized routes must come after the fixed ones!

  app.get('/edit/:groupname', function (req, res, next) {
    groupsAPI.getGroup(req.params.groupname, function (err, group) {
      if (err) { return next(err); }
      res.render('edit', { group: group ? group : new Group()});
    });
  });

  app.get('/checkgroupname', function (req, res) {
    var groupname = req.query.id;
    groupsAPI.isGroupNameAvailable(groupname, function (err, result) {
      if (err) { return res.end('false'); }
      res.end(result.toString());
    });
  });

  app.get('/checkemailprefix', function (req, res) {
    var prefix = req.query.emailPrefix;
    groupsAPI.isEmailPrefixAvailable(prefix, function (err, result) {
      if (err) { return res.end('false'); }
      res.end(result.toString());
    });
  });

  app.get('/subscribe/:groupname', function (req, res, next) {
    return groupsAPI.addUserToList(req.user.member.email, req.params.groupname, function (err) {
      if (err) { return next(err); }
      res.redirect('/groups/' + req.params.groupname);
    });
  });

  app.get('/unsubscribe/:groupname', function (req, res, next) {
    return groupsAPI.removeUserFromList(req.user.member.email, req.params.groupname, function (err) {
      if (err) { return next(err); }
      res.redirect('/groups/' + req.params.groupname);
    });
  });

  app.get('/:groupname', function (req, res, next) {
    function registeredUserId(req) {
      return req && req.user ? req.user.identifier : undefined;
    }

    groupsAndMembers.getGroupAndMembersForList(req.params.groupname, function (err, group) {
      if (err) {
        return next(err);
      }
      var members = group ? group.members : [];
      res.render('get', {group: group, users: members,
        userIsGroupMember: groupsAndMembers.userIsInMemberList(registeredUserId(req), members) });
    });
  });

  return app;
};
