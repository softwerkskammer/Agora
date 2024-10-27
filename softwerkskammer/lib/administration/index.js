"use strict";
const beans = require("simple-configure").get("beans");
const membersService = beans.get("membersService");
const memberstore = beans.get("memberstore");
const groupstore = beans.get("groupstore");
const activitystore = beans.get("activitystore");
const activitiesService = beans.get("activitiesService");
const misc = beans.get("misc");
const Group = beans.get("group");

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
