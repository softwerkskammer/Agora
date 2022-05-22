const beans = require("simple-configure").get("beans");
const membersService = beans.get("membersService");
const memberstore = beans.get("memberstore");
const groupstore = beans.get("groupstore");
const activitystore = beans.get("activitystore");
const activitiesService = beans.get("activitiesService");
const misc = beans.get("misc");
const Group = beans.get("group");

const app = misc.expressAppIn(__dirname);

app.get("/memberTable", async (req, res) => {
  const members = await memberstore.allMembers();
  res.render("memberTable", { members });
});

app.get("/memberAndGroupTable", async (req, res) => {
  const [groups, members] = await Promise.all([groupstore.allGroups(), memberstore.allMembers()]);
  res.render("memberAndGroupTable", { members: members, groups: groups });
});

app.get("/groupTable", async (req, res) => {
  const groups = await groupstore.allGroups();
  res.render("groupTable", { groups, groupTypes: Group.allTypes() });
});

app.get("/activityTable", async (req, res) => {
  const activities = await activitiesService.getActivitiesForDisplay(activitystore.allActivities);
  res.render("activityTable", { activities });
});

app.get("/interests", async (req, res) => {
  const members = await memberstore.allMembers();
  res.render("interests", { interests: membersService.toUngroupedWordList(members) });
});

module.exports = app;
