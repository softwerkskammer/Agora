const async = require("async");

const beans = require("simple-configure").get("beans");
const membersService = beans.get("membersService");
const memberstore = beans.get("memberstore");
const groupstore = beans.get("groupstore");
const activitystore = beans.get("activitystore");
const activitiesService = beans.get("activitiesService");
const misc = beans.get("misc");
const Group = beans.get("group");

const app = misc.expressAppIn(__dirname);

app.get("/memberTable", (req, res, next) => {
  memberstore.allMembers((err, members) => {
    if (err) {
      return next(err);
    }
    res.render("memberTable", { members });
  });
});

app.get("/memberAndGroupTable", (req, res, next) => {
  async.parallel(
    {
      groups: async.asyncify(groupstore.allGroups),
      members: memberstore.allMembers,
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render("memberAndGroupTable", { members: results.members, groups: results.groups });
    }
  );
});

app.get("/groupTable", async (req, res) => {
  const groups = await groupstore.allGroups();
  res.render("groupTable", { groups, groupTypes: Group.allTypes() });
});

app.get("/activityTable", (req, res, next) =>
  activitiesService.getActivitiesForDisplay(activitystore.allActivities, (err, activities) => {
    if (err) {
      return next(err);
    }
    res.render("activityTable", { activities });
  })
);

app.get("/interests", (req, res, next) => {
  memberstore.allMembers((err, members) => {
    if (err || !members) {
      return next(err);
    }
    res.render("interests", { interests: membersService.toUngroupedWordList(members) });
  });
});

module.exports = app;
