const R = require("ramda");

const conf = require("simple-configure");
const beans = conf.get("beans");
const misc = beans.get("misc");
const CONFLICTING_VERSIONS = beans.get("constants").CONFLICTING_VERSIONS;
const activitiesService = beans.get("activitiesService");
const calendarService = beans.get("calendarService");
const icalService = beans.get("icalService");
const groupstore = beans.get("groupstore");
const groupsService = beans.get("groupsService");
const activitystore = beans.get("activitystore");
const memberstore = beans.get("memberstore");
const meetupActivitiesService = beans.get("meetupActivitiesService");

const Activity = beans.get("activity");
const Group = beans.get("group");
const validation = beans.get("validation");
const statusmessage = beans.get("statusmessage");
const resourceRegistrationRenderer = beans.get("resourceRegistrationRenderer");

const reservedURLs = conf.get("reservedActivityURLs");

const app = misc.expressAppIn(__dirname);

function editorNameOf(member) {
  return member.displayName() + " (" + member.nickname() + ")".replace(",", "");
}

async function activitySubmitted(req, res) {
  let activity = await activitiesService.getActivityWithGroupAndParticipants(req.body.previousUrl);
  if (!activity) {
    activity = new Activity({ owner: req.user.member.id() });
  }
  const editorNames = misc.toArray(req.body.editorIds);
  // editor can be either a name in the format editorNameOf() - for participants - or just a nickname - for manually entered
  const nicknames = editorNames.map(misc.betweenBraces);
  const members = await Promise.all(nicknames.map(memberstore.getMember));
  const membersForEditors = members.filter((m) => m); // only truthy members
  const editorIds = membersForEditors.map((editor) => editor.id());
  activity.fillFromUI(req.body, editorIds);
  try {
    await activitystore.saveActivity(activity);
    statusmessage
      .successMessage("message.title.save_successful", "message.content.activities.saved")
      .putIntoSession(req);
    res.redirect("/activities/" + encodeURIComponent(activity.url()));
  } catch (err2) {
    if (err2 && err2.message === CONFLICTING_VERSIONS) {
      // we try again because of a racing condition during save:
      statusmessage.errorMessage("message.title.conflict", "message.content.save_error_retry").putIntoSession(req);
      return res.redirect("/activities/edit/" + encodeURIComponent(activity.url()));
    }
    throw err2;
  }
}

async function activitiesForDisplay(activitiesFetcher, res, title) {
  const activities = await activitiesService.getActivitiesForDisplay(activitiesFetcher);
  res.render("index", {
    activities,
    range: title,
    webcalURL: conf.get("publicUrlPrefix").replace("http", "webcal") + "/activities/ical",
  });
}

function sendCalendarStringNamedToResult(ical, filename, res) {
  res.type("text/calendar; charset=utf-8");
  res.header("Content-Disposition", "inline; filename=" + filename + ".ics");
  res.send(ical.toString());
}

app.get("/", async (req, res) => {
  activitiesForDisplay(activitystore.allActivities, res, req.i18n.t("general.all"));
});

async function renderGdcrFor(gdcrDay, res) {
  const gdcrDate = new Date(gdcrDay);
  const gdcrActivities = R.partial(activitiesService.activitiesBetween, [
    gdcrDate.getTime(),
    gdcrDate.getTime() + 86400000,
  ]); // 1 day

  const activities = await activitiesService.getActivitiesForDisplay(gdcrActivities);
  const gdcrYear = gdcrDate.getFullYear();
  res.render("gdcr", {
    activities,
    year: String(gdcrYear),
    previousYears: R.range(2013, gdcrYear)
      .map((year) => String(year))
      .reverse(),
  });
}

app.get("/gdcr2013", async (req, res, next) => renderGdcrFor("2013-12-14", res, next));

app.get("/gdcr2014", async (req, res, next) => renderGdcrFor("2014-11-15", res, next));

app.get("/gdcr2015", async (req, res, next) => renderGdcrFor("2015-11-14", res, next));

app.get("/gdcr2016", async (req, res, next) => renderGdcrFor("2016-10-22", res, next));

app.get("/gdcr2017", async (req, res, next) => renderGdcrFor("2017-11-18", res, next));

app.get("/gdcr2018", async (req, res, next) => renderGdcrFor("2018-11-17", res, next));

app.get("/gdcr", async (req, res, next) => renderGdcrFor("2019-11-16", res, next));

app.get("/upcoming", async (req, res) =>
  activitiesForDisplay(activitystore.upcomingActivities, res, req.i18n.t("activities.upcoming"))
);

app.get("/past", async (req, res) =>
  activitiesForDisplay(activitystore.pastActivities, res, req.i18n.t("activities.past"))
);

app.get("/ical", async (req, res) => {
  const activities = await activitystore.upcomingActivities();
  sendCalendarStringNamedToResult(icalService.icalForActivities(activities), "events", res);
});

app.get("/icalForGroup/:group", async (req, res) => {
  const activities = await activitystore.upcomingActivities();
  const groupsActivities = activities.filter((activity) => activity.assignedGroup() === req.params.group);
  sendCalendarStringNamedToResult(icalService.icalForActivities(groupsActivities), "events", res);
});

app.get("/ical/:url", async (req, res) => {
  const activity = await activitystore.getActivity(req.params.url);
  sendCalendarStringNamedToResult(icalService.activityAsICal(activity), activity.url(), res);
});

app.get("/eventsForSidebar", async (req, res) => {
  const start = new Date(req.query.start).getTime();
  const end = new Date(req.query.end).getTime();

  const groupColors = await groupsService.allGroupColors();
  const events = await calendarService.eventsBetween(start, end, groupColors);
  res.end(JSON.stringify(events));
});

async function renderActivityCombinedWithGroups(res, activity) {
  async function render(groups) {
    const editors = await memberstore.getMembersForIds(activity.editorIds());
    if (!editors) {
      throw new Error();
    }
    const editorNames = editors.map(editorNameOf);
    activity.participants = (activity.participants || []).filter(
      (participant) => participant.id() !== activity.owner()
    );
    const participantNames = (activity.participants || []).map(editorNameOf);

    if (activity.group && !groups.find((group) => group.id === activity.assignedGroup())) {
      groups.push(activity.group);
    }
    res.render("edit", {
      activity,
      groups,
      editorNames,
      participantNames: R.union(editorNames, participantNames),
    });
  }

  if (res.locals.accessrights.isSuperuser()) {
    const allGroups = await groupstore.allGroups();
    return render(allGroups);
  }

  // API geändert von email() auf member und Methode umbenannt
  const subscribedGroups = await groupsService.getSubscribedGroupsForMember(res.locals.user.member);
  return render(Group.regionalsFrom(subscribedGroups).concat(Group.thematicsFrom(subscribedGroups)));
}

app.get("/new", async (req, res) => renderActivityCombinedWithGroups(res, new Activity()));

app.get("/newLike/:url", async (req, res) => {
  const activity = await activitystore.getActivity(req.params.url);
  renderActivityCombinedWithGroups(res, activity.resetForClone());
});

app.get("/edit/:url", async (req, res, next) => {
  const activity = await activitiesService.getActivityWithGroupAndParticipants(req.params.url);
  if (activity === null) {
    return next();
  }
  if (activity.isSoCraTes()) {
    return res.redirect(activity.fullyQualifiedUrl());
  }
  if (!res.locals.accessrights.canEditActivity(activity)) {
    return res.redirect("/activities/" + encodeURIComponent(req.params.url));
  }
  renderActivityCombinedWithGroups(res, activity);
});

app.post("/submit", async (req, res) => {
  async function validate() {
    try {
      const result = await validation.checkValidity(
        req.body.previousUrl.trim(),
        req.body.url.trim(),
        R.partial(activitiesService.isValidUrl, [reservedURLs])
      );
      if (!result) {
        return req.i18n.t("validation.url_not_available");
      }
    } catch (e) {
      return req.i18n.t("validation.url_not_available");
    }
  }
  const errorMessages = await Promise.all([validate(), validation.isValidForActivity(req.body)]);
  const realErrors = R.flatten(errorMessages).filter((message) => message);
  if (realErrors.length === 0) {
    return activitySubmitted(req, res);
  }
  return res.render("../../../views/errorPages/validationError", { errors: realErrors });
});

app.post("/clone-from-meetup", async (req, res) => {
  await meetupActivitiesService.cloneActivitiesFromMeetup();
  res.redirect("/activities");
});

app.get("/checkurl", async (req, res) => {
  const result = await misc.validate(
    req.query.url,
    req.query.previousUrl,
    R.partial(activitiesService.isValidUrl, [reservedURLs])
  );
  res.end(result);
});

app.get("/:url", async (req, res, next) => {
  const activity = await activitiesService.getActivityWithGroupAndParticipants(req.params.url);
  if (!activity) {
    return next();
  }
  if (activity.isSoCraTes()) {
    return res.redirect(activity.fullyQualifiedUrl());
  }
  const editors = await memberstore.getMembersForIds(activity.editorIds());
  if (!editors) {
    return next();
  }
  const editorNicknames = editors.map((editor) => editor.nickname());
  const allowsRegistration = activity
    .resourceNames()
    .every((resourceName) => activity.resourceNamed(resourceName).limit() !== 0);
  res.render("get", {
    activity,
    allowsRegistration,
    editorNicknames,
    resourceRegistrationRenderer,
  });
});

async function subscribe(body, req, res) {
  const activityUrl = body.url;

  const [statusTitle, statusText] = await activitiesService.addVisitorTo(req.user.member.id(), activityUrl, Date.now());
  if (statusTitle && statusText) {
    statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
  } else {
    statusmessage
      .successMessage("message.title.save_successful", "message.content.activities.participation_added")
      .putIntoSession(req);
  }
  res.redirect("/activities/" + encodeURIComponent(activityUrl));
}

app.post("/subscribe", async (req, res) => subscribe(req.body, req, res));

app.get("/subscribe", async (req, res, next) => {
  // in case the call was redirected via login, we get called with "get"
  const body = req.session.previousBody;
  if (!body) {
    return next();
  }
  delete req.session.previousBody;
  subscribe(body, req, res);
});

app.post("/unsubscribe", async (req, res) => {
  // unsubscribe can only be called when user is already logged in
  const activityUrl = req.body.url;
  const [statusTitle, statusText] = await activitiesService.removeVisitorFrom(req.user.member.id(), activityUrl);
  if (statusTitle && statusText) {
    statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
  } else {
    statusmessage
      .successMessage("message.title.save_successful", "message.content.activities.participation_removed")
      .putIntoSession(req);
  }
  res.redirect("/activities/" + encodeURIComponent(activityUrl));
});

async function addToWaitinglist(body, req, res) {
  const [statusTitle, statusText] = await activitiesService.addToWaitinglist(
    req.user.member.id(),
    body.url,
    Date.now()
  );
  if (statusTitle && statusText) {
    statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
  } else {
    statusmessage
      .successMessage("message.title.save_successful", "message.content.activities.waitinglist_added")
      .putIntoSession(req);
  }
  res.redirect("/activities/" + encodeURIComponent(body.url));
}

app.post("/addToWaitinglist", async (req, res) => {
  addToWaitinglist(req.body, req, res);
});

app.get("/addToWaitinglist", async (req, res, next) => {
  // in case the call was redirected via login, we get called with "get"
  const body = req.session.previousBody;
  if (!body) {
    return next();
  }
  delete req.session.previousBody;
  addToWaitinglist(body, req, res, next);
});

app.post("/removeFromWaitinglist", async (req, res) => {
  // removeFromWaitinglist can only be called when user is already logged in
  const [statusTitle, statusText] = await activitiesService.removeFromWaitinglist(req.user.member.id(), req.body.url);
  if (statusTitle && statusText) {
    statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
  } else {
    statusmessage
      .successMessage("message.title.save_successful", "message.content.activities.waitinglist_removed")
      .putIntoSession(req);
  }
  res.redirect("/activities/" + encodeURIComponent(req.body.url));
});

app.post("/delete", async (req, res) => {
  const url = req.body.activityUrl;
  const activity = await activitystore.getActivity(url);
  if (!res.locals.accessrights.canDeleteActivity(activity)) {
    return res.redirect("/activities/" + encodeURIComponent(url));
  }
  await activitystore.removeActivity(activity);
  statusmessage
    .successMessage("message.title.save_successful", "message.content.activities.deleted")
    .putIntoSession(req);
  res.redirect("/activities/");
});

module.exports = app;
