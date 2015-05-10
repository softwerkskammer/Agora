'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');
var async = require('async');

var misc = beans.get('misc');
var groupsService = beans.get('groupsService');
var wikiService = beans.get('wikiService');
var Group = beans.get('group');
var groupsAndMembers = beans.get('groupsAndMembersService');
var activitystore = beans.get('activitystore');
var statusmessage = beans.get('statusmessage');

var app = misc.expressAppIn(__dirname);

function groupSubmitted(req, res, next) {
  var group = new Group(req.body);
  groupsService.isGroupValid(group, function (errors) {
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }
    groupsAndMembers.saveGroup(group, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.groups.saved').putIntoSession(req);
      res.redirect('/groups/' + group.id);
    });
  });
}

// display all groups
app.get('/', function (req, res, next) {
  groupsService.getAllAvailableGroups(function (err, groups) {
    if (err) { return next(err); }
    async.map(groups, function (group, callback) { groupsAndMembers.addMembercountToGroup(group, callback); },
      function (err1, groupsWithMembers) {
        if (err1) { return next(err1); }
        res.render('index', {
          regionalgroups: Group.regionalsFrom(groupsWithMembers),
          themegroups: Group.thematicsFrom(groupsWithMembers)
        });
      });
  });
});

app.get('/new', function (req, res) {
  res.render('edit', {
    group: new Group(),
    allTypes: Group.allTypes(),
    organizersChecked: [
      {member: req.user.member, checked: true}
    ]
  });
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
    var realGroup = group || new Group();
    var organizersChecked = realGroup.checkedOrganizers(realGroup.members);
    res.render('edit', {group: realGroup, allTypes: Group.allTypes(), organizersChecked: organizersChecked});
  });
});

app.get('/checkgroupname', function (req, res) {
  misc.validate(req.query.id, null, groupsService.isGroupNameAvailable, res.end);
});

app.get('/checkemailprefix', function (req, res) {
  misc.validate(req.query.emailPrefix, null, groupsService.isEmailPrefixAvailable, res.end);
});

app.post('/subscribe', function (req, res) {
  groupsAndMembers.subscribeMemberToGroup(req.user.member, req.body.groupname, function (err) {
    if (err) {
      statusmessage.errorMessage('message.title.problem', 'message.content.save_error_reason', {err: err.toString()}).putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.groups.subscribed').putIntoSession(req);
    }
    res.redirect('/groups/' + req.body.groupname);
  });
});

app.post('/unsubscribe', function (req, res) {
  groupsAndMembers.unsubscribeMemberFromGroup(req.user.member, req.body.groupname, function (err) {
    if (err) {
      statusmessage.errorMessage('message.title.problem', 'message.content.save_error_reason', {err: err.toString()}).putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.groups.unsubscribed').putIntoSession(req);
    }
    res.redirect('/groups/' + req.body.groupname);
  });
});

app.get('/:groupname', function (req, res, next) {
  function registeredUserId() {
    return req && req.user ? req.user.member.id() : undefined;
  }

  groupsAndMembers.getGroupAndMembersForList(req.params.groupname, function (err, group) {
    if (err || !group) { return next(err); }
    wikiService.getBlogpostsForGroup(req.params.groupname, function (err1, blogposts) {
      if (err1) { return next(err1); }
      activitystore.upcomingActivitiesForGroupIds([group.id], function (err2, activities) {
        if (err2) { return next(err2); }
        res.render('get', {
          group: group,
          users: group.members,
          userIsGroupMember: groupsAndMembers.memberIsInMemberList(registeredUserId(), group.members),
          organizers: group.organizers,
          blogposts: blogposts,
          webcalURL: conf.get('publicUrlPrefix').replace('http', 'webcal') + '/activities/icalForGroup/' + group.id,
          upcomingGroupActivities: activities || []
        });
      });
    });
  });
});

module.exports = app;
