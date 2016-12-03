'use strict';

const async = require('async');
const R = require('ramda');

const beans = require('simple-configure').get('beans');
const membersService = beans.get('membersService');
const memberstore = beans.get('memberstore');
const groupsService = beans.get('groupsService');
const groupsAndMembersService = beans.get('groupsAndMembersService');
const activitystore = beans.get('activitystore');
const activitiesService = beans.get('activitiesService');
const misc = beans.get('misc');
const Group = beans.get('group');

const app = misc.expressAppIn(__dirname);

app.get('/memberTable', (req, res, next) => {
  memberstore.allMembers((err, members) => {
    if (err) { return next(err); }
    memberstore.socratesOnlyMembers((err1, socMembers) => {
      if (err1) { return next(err1); }
      res.render('memberTable', {members: R.union(members, socMembers)});
    });
  });
});

app.get('/memberAndGroupTable', (req, res, next) => {
  async.parallel(
    {
      groups: groupsService.getAllAvailableGroups,
      membersAndInfo: groupsAndMembersService.getAllMembersWithTheirGroups
    },
    (err, results) => {
      if (err) { return next(err); }
      res.render('memberAndGroupTable', {members: results.membersAndInfo[0], groupsWithExtraEmailAddresses: results.membersAndInfo[1], groups: results.groups});
    }
  );
});

app.get('/groupTable', (req, res, next) => {
  groupsService.getAllAvailableGroups((err, groups) => {
    if (err) { return next(err); }
    res.render('groupTable', {groups: groups, groupTypes: Group.allTypes()});
  });
});

app.get('/activityTable', (req, res, next) => activitiesService.getActivitiesForDisplay(activitystore.allActivities, (err, activities) => {
  if (err) { return next(err); }
  res.render('activityTable', {activities: activities});
}));

app.get('/interests', (req, res, next) => {
  memberstore.allMembers((err, members) => {
    if (err || !members) { return next(err); }
    res.render('interests', {interests: membersService.toUngroupedWordList(members)});
  });
});

module.exports = app;
