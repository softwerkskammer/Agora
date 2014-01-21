"use strict";

var path = require('path');
var beans = require('nconf').get('beans');
var async = require('async');

var groupsAPI = beans.get('groupsAPI');
var wikiAPI = beans.get('wikiAPI');
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
    groupsAndMembers.saveGroup(group, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage(req, 'message.title.save_successful', 'message.content.groups.saved');
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
    res.render('edit', { group: new Group(), allTypes: Group.allTypes(), organizersChecked: [
      {member: req.user.member, checked: true}
    ] });
  });

  app.post('/submit', function (req, res, next) {
    groupSubmitted(req, res, next);
  });

  // the parameterized routes must come after the fixed ones!

  app.get('/edit/:groupname', function (req, res, next) {
    groupsAndMembers.getGroupAndMembersForList(req.params.groupname, function (err, group) {
      if (err || !group) { return next(err); }
      if (!res.locals.accessrights.canEditGroup(group)) {
        return res.redirect('/groups/' + encodeURIComponent(req.params.groupname));
      }
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
    groupsAndMembers.subscribeMemberToGroup(req.user.member, req.params.groupname, function (err) {
      if (err) { return next(err); }
      res.redirect('/groups/' + req.params.groupname);
    });
  });

  app.get('/unsubscribe/:groupname', function (req, res, next) {
    groupsAndMembers.unsubscribeMemberFromGroup(req.user.member, req.params.groupname, function (err) {
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
<<<<<<< HEAD
      res.render('get', {group: group, users: group.members,
        userIsGroupMember: groupsAndMembers.userIsInMemberList(registeredUserId(req), group.members),
        organizers: group.organizers});
      });
=======
      wikiAPI.getBlogpostsForGroup(req.params.groupname, function (err, blogposts) {
        res.render('get', {group: group, users: group.members,
          userIsGroupMember: groupsAndMembers.memberIsInMemberList(registeredUserId(req), group.members),
          organizers: group.organizers,
          blogposts: blogposts});
      });
    });
>>>>>>> da1a73ea4d26a2e5e5592be7d5c55bbe97ea9ede
  });

  return app;
};
