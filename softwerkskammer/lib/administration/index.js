"use strict";
const membersService = require("../members/membersService");
const memberstore = require("../members/memberstore");
const groupstore = require("../groups/groupstore");
const activitystore = require("../activities/activitystore");
const activitiesService = require("../activities/activitiesService");
const misc = require("../commons/misc");
const Group = require("../groups/group");

const app = misc.expressAppIn(__dirname);

app.get("/memberTable", (req, res) => {
  const members = memberstore.allMembers();
  res.render("memberTable", { members });
});

app.get("/memberAndGroupTable", (req, res) => {
  const groups = groupstore.allGroups();
  const members = memberstore.allMembers();
  res.render("memberAndGroupTable", { members: members, groups: groups });
});

app.get("/groupTable", (req, res) => {
  const groups = groupstore.allGroups();
  res.render("groupTable", { groups, groupTypes: Group.allTypes() });
});

app.get("/activityTable", (req, res) => {
  const activities = activitiesService.getActivitiesForDisplay(activitystore.allActivities);
  res.render("activityTable", { activities });
});

app.get("/interests", (req, res) => {
  const members = memberstore.allMembers();
  res.render("interests", { interests: membersService.toUngroupedWordList(members) });
});

module.exports = app;
