const conf = require("simple-configure");
const beans = conf.get("beans");
const R = require("ramda");
const Feed = require("feed").Feed;

const misc = beans.get("misc");
const groupsService = beans.get("groupsService");
const groupstore = beans.get("groupstore");
const wikiService = beans.get("wikiService");
const Group = beans.get("group");
const groupsAndMembers = beans.get("groupsAndMembersService");
const meetupActivitiesService = beans.get("meetupActivitiesService");
const activitystore = beans.get("activitystore");
const statusmessage = beans.get("statusmessage");

const app = misc.expressAppIn(__dirname);

async function groupSubmitted(req, res) {
  const group = new Group(req.body);
  const errors = await groupsService.isGroupValid(group);
  if (errors.length !== 0) {
    return res.render("../../../views/errorPages/validationError", { errors });
  }
  const existingGroup = await groupstore.getGroup(group.id);
  if (!existingGroup) {
    group.subscribe(req.user.member);
  } else {
    group.subscribedMembers = existingGroup.subscribedMembers;
  }
  await groupstore.saveGroup(group);
  statusmessage.successMessage("message.title.save_successful", "message.content.groups.saved").putIntoSession(req);
  res.redirect("/groups/" + group.id);
}

// display all groups
app.get("/", async (req, res) => {
  const groups = await groupstore.allGroups();
  res.render("index", {
    regionalgroups: Group.regionalsFrom(groups),
    themegroups: Group.thematicsFrom(groups),
  });
});

app.get("/new", (req, res) => {
  res.render("edit", {
    group: new Group(),
    allTypes: Group.allTypes(),
    organizersChecked: [{ member: req.user.member, checked: true }],
  });
});

app.post("/submit", (req, res, next) => groupSubmitted(req, res, next));

// the parameterized routes must come after the fixed ones!

app.get("/edit/:groupname", async (req, res) => {
  const group = await groupsAndMembers.getGroupAndMembersForList(req.params.groupname);
  if (!group) {
    throw new Error();
  }
  if (!res.locals.accessrights.canEditGroup(group)) {
    return res.redirect("/groups/" + encodeURIComponent(req.params.groupname));
  }
  const realGroup = group || new Group();
  const organizersChecked = realGroup.checkedOrganizers(realGroup.members);
  res.render("edit", { group: realGroup, allTypes: Group.allTypes(), organizersChecked });
});

app.post("/clone-from-meetup-for-group", async (req, res, next) => {
  try {
    const group = await groupstore.getGroup(req.body.groupname);
    meetupActivitiesService.cloneActivitiesFromMeetupForGroup(group, (err2) => {
      if (err2) {
        return next(err2);
      }
      res.redirect("/groups/" + req.body.groupname);
    });
  } catch (e) {
    return next(e);
  }
});

app.get("/checkgroupname", async (req, res) => {
  return misc.validateAsync(req.query.id, null, groupsService.isGroupNameAvailable, res.end);
});

app.get("/checkemailprefix", async (req, res) => {
  misc.validateAsync(req.query.emailPrefix, null, groupsService.isEmailPrefixAvailable, res.end);
});

app.post("/subscribe", async (req, res) => {
  try {
    await groupsService.addMemberToGroupNamed(req.user.member, req.body.groupname);
    statusmessage
      .successMessage("message.title.save_successful", "message.content.groups.subscribed")
      .putIntoSession(req);
  } catch (err) {
    statusmessage
      .errorMessage("message.title.problem", "message.content.save_error_reason", { err: err.toString() })
      .putIntoSession(req);
  }
  res.redirect("/groups/" + req.body.groupname);
});

app.post("/unsubscribe", async (req, res) => {
  try {
    await groupsService.removeMemberFromGroupNamed(req.user.member, req.body.groupname);
    statusmessage
      .successMessage("message.title.save_successful", "message.content.groups.unsubscribed")
      .putIntoSession(req);
  } catch (err) {
    statusmessage
      .errorMessage("message.title.problem", "message.content.save_error_reason", { err: err.toString() })
      .putIntoSession(req);
  }
  res.redirect("/groups/" + req.body.groupname);
});

app.get("/:groupname", async (req, res, next) => {
  function addGroupDataToActivity(activities, group) {
    activities.forEach((activity) => {
      activity.colorRGB = group.color;
      activity.group = group; // sets the group object in activity
    });
    return activities;
  }

  try {
    const group = await groupsAndMembers.getGroupAndMembersForList(req.params.groupname);
    if (!group) {
      return next();
    }
    wikiService.getBlogpostsForGroup(req.params.groupname, async (err1, blogposts) => {
      if (err1) {
        return next(err1);
      }
      const activities = await activitystore.upcomingActivitiesForGroupIds([group.id]);
      const pastActivities = await activitystore.pastActivitiesForGroupIds([group.id]);
      const registeredUserId = req && req.user ? req.user.member.id() : undefined;
      res.render("get", {
        group,
        users: group.members,
        userIsGroupMember: registeredUserId && group.isMemberSubscribed(req.user.member),
        organizers: group.organizers,
        blogposts,
        blogpostsFeedUrl: req.originalUrl + "/feed",
        webcalURL: conf.get("publicUrlPrefix").replace("http", "webcal") + "/activities/icalForGroup/" + group.id,
        upcomingGroupActivities: addGroupDataToActivity(activities, group) || [],
        recentGroupActivities: addGroupDataToActivity(pastActivities ? R.take(5, pastActivities) : [], group),
      });
    });
  } catch (e) {
    return next(e);
  }
});

app.get("/:groupname/feed", async (req, res, next) => {
  try {
    const group = await groupsAndMembers.getGroupAndMembersForList(req.params.groupname);
    if (!group) {
      return next();
    }
    wikiService.getBlogpostsForGroup(req.params.groupname, (err1, blogposts) => {
      if (err1) {
        return next(err1);
      }

      const updated = blogposts.length > 0 ? blogposts[0].date().toJSDate() : undefined;
      const baseUrl = conf.get("publicUrlPrefix");

      const feed = new Feed({
        id: baseUrl + req.originalUrl,
        title: [res.locals.siteTitle, group.longName, req.i18n.t("wiki.blogposts")].join(" - "),
        favicon: baseUrl + "/favicon.ico",
        image: baseUrl + res.locals.siteLogoPath,
        updated: updated,
        generator: "Agora",
      });

      blogposts.forEach((post) => {
        feed.addItem({
          title: post.title,
          id: post.name,
          link: baseUrl + post.url(),
          content: post.renderBody(),
          date: post.date().toJSDate(),
        });
      });

      res.type("application/atom+xml");
      res.send(feed.atom1());
    });
  } catch (e) {
    return next(e);
  }
});

module.exports = app;
