"use strict";

var path = require('path');
var beans = require('nconf').get('beans');
var async = require('async');

var groupsAPI = beans.get('groupsAPI');
var Group = beans.get('group');
var groupsAndMembers = beans.get('groupsAndMembersAPI');
var statusmessage = beans.get('statusmessage');

module.exports = function (app) {

  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  function groupSubmitted(req, res, next) {
    var group = new Group(req.body);
    var errors = groupsAPI.isGroupValid(group);
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }
    groupsAPI.createOrSaveGroup(group, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('Speichern erfolgreich', 'Deine Gruppe wurde gespeichert.').putInSession(req);
      res.redirect('/groups/' + group.id);
    });
  }

  // display all groups
  app.get('/', function (req, res, next) {
    groupsAPI.getAllAvailableGroups(function (err, groups) {
      if (err) { return next(err); }
      async.map(groups, function (group, callback) { groupsAndMembers.addMembercountToGroup(group, callback); },
        function (err, groupsWithMembers) {
          if (err) { return next(err); }
          res.render('index', {regionalgroups: Group.regionalsFrom(groupsWithMembers), themegroups: Group.thematicsFrom(groupsWithMembers)});
        });
    });
  });

  app.get('/new', function (req, res) {
    res.render('edit', { group: new Group(), allTypes: Group.allTypes(), organizersChecked: [] });
  });

  app.post('/submit', function (req, res, next) {
    groupSubmitted(req, res, next);
  });

  // the parameterized routes must come after the fixed ones!

  app.get('/edit/:groupname', function (req, res, next) {
    groupsAndMembers.getGroupAndMembersForList(req.params.groupname, function (err, group) {
      if (err || !group) { return next(err); }
      var realGroup = group ? group : new Group();
      var organizersChecked = realGroup.checkedOrganizers(realGroup.members);
      res.render('edit', {group: realGroup, allTypes: Group.allTypes(), organizersChecked: organizersChecked});
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
      return req && req.user ? req.user.authenticationId : undefined;
    }

    groupsAndMembers.getGroupAndMembersForList(req.params.groupname, function (err, group) {
      if (err || !group) { return next(err); }
      groupsAPI.getBlogposts(req.params.groupname, function (err, blogposts) {
        res.render('get', {group: group, users: group.members,
        userIsGroupMember: groupsAndMembers.userIsInMemberList(registeredUserId(req), group.members),
        organizers: group.organizers,
        blogposts : blogposts});
      });
    });
  });

  return app;
}
;
