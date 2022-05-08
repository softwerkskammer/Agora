const async = require("async");
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

function activitySubmitted(req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.body.previousUrl, (err, activity) => {
    if (err) {
      return next(err);
    }
    if (!activity) {
      activity = new Activity({ owner: req.user.member.id() });
    }
    const editorNames = misc.toArray(req.body.editorIds);
    // editor can be either a name in the format editorNameOf() - for participants - or just a nickname - for manually entered
    const nicknames = editorNames.map(misc.betweenBraces);
    async.map(nicknames, memberstore.getMember, (err1, members) => {
      const membersForEditors = members.filter((m) => m); // only truthy members
      const editorIds = membersForEditors.map((editor) => editor.id());
      activity.fillFromUI(req.body, editorIds);
      activitystore.saveActivity(activity, (err2) => {
        if (err2 && err2.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          statusmessage.errorMessage("message.title.conflict", "message.content.save_error_retry").putIntoSession(req);
          return res.redirect("/activities/edit/" + encodeURIComponent(activity.url()));
        }
        if (err2) {
          return next(err2);
        }
        statusmessage
          .successMessage("message.title.save_successful", "message.content.activities.saved")
          .putIntoSession(req);
        res.redirect("/activities/" + encodeURIComponent(activity.url()));
      });
    });
  });
}

function activitiesForDisplay(activitiesFetcher, next, res, title) {
  return activitiesService.getActivitiesForDisplay(activitiesFetcher, (err, activities) => {
    if (err) {
      next(err);
    }
    res.render("index", {
      activities,
      range: title,
      webcalURL: conf.get("publicUrlPrefix").replace("http", "webcal") + "/activities/ical",
    });
  });
}

function sendCalendarStringNamedToResult(ical, filename, res) {
  res.type("text/calendar; charset=utf-8");
  res.header("Content-Disposition", "inline; filename=" + filename + ".ics");
  res.send(ical.toString());
}

app.get("/", (req, res, next) => {
  activitiesForDisplay(activitystore.allActivities, next, res, req.i18n.t("general.all"));
});

function renderGdcrFor(gdcrDay, res, next) {
  const gdcrDate = new Date(gdcrDay);
  const gdcrActivities = R.partial(activitiesService.activitiesBetween, [
    gdcrDate.getTime(),
    gdcrDate.getTime() + 86400000,
  ]); // 1 day

  return activitiesService.getActivitiesForDisplay(gdcrActivities, (err, activities) => {
    if (err) {
      next(err);
    }
    const gdcrYear = gdcrDate.getFullYear();
    res.render("gdcr", {
      activities,
      year: String(gdcrYear),
      previousYears: R.range(2013, gdcrYear)
        .map((year) => String(year))
        .reverse(),
    });
  });
}

app.get("/gdcr2013", (req, res, next) => renderGdcrFor("2013-12-14", res, next));

app.get("/gdcr2014", (req, res, next) => renderGdcrFor("2014-11-15", res, next));

app.get("/gdcr2015", (req, res, next) => renderGdcrFor("2015-11-14", res, next));

app.get("/gdcr2016", (req, res, next) => renderGdcrFor("2016-10-22", res, next));

app.get("/gdcr2017", (req, res, next) => renderGdcrFor("2017-11-18", res, next));

app.get("/gdcr2018", (req, res, next) => renderGdcrFor("2018-11-17", res, next));

app.get("/gdcr", (req, res, next) => renderGdcrFor("2019-11-16", res, next));

app.get("/upcoming", (req, res, next) =>
  activitiesForDisplay(activitystore.upcomingActivities, next, res, req.i18n.t("activities.upcoming"))
);

app.get("/past", (req, res, next) =>
  activitiesForDisplay(activitystore.pastActivities, next, res, req.i18n.t("activities.past"))
);

app.get("/ical", (req, res, next) => {
  activitystore.upcomingActivities((err, activities) => {
    if (err || !activities) {
      return next(err);
    }
    sendCalendarStringNamedToResult(icalService.icalForActivities(activities), "events", res);
  });
});

app.get("/icalForGroup/:group", (req, res, next) => {
  activitystore.upcomingActivities((err, activities) => {
    if (err || !activities) {
      return next(err);
    }
    const groupsActivities = activities.filter((activity) => activity.assignedGroup() === req.params.group);
    sendCalendarStringNamedToResult(icalService.icalForActivities(groupsActivities), "events", res);
  });
});

app.get("/ical/:url", (req, res, next) => {
  activitystore.getActivity(req.params.url, (err, activity) => {
    if (err || !activity) {
      return next(err);
    }
    sendCalendarStringNamedToResult(icalService.activityAsICal(activity), activity.url(), res);
  });
});

app.get("/eventsForSidebar", async (req, res, next) => {
  const start = new Date(req.query.start).getTime();
  const end = new Date(req.query.end).getTime();

  try {
    const groupColors = await groupsService.allGroupColors();
    calendarService.eventsBetween(start, end, groupColors, (err1, events) => {
      if (err1) {
        return next(err1);
      }
      res.end(JSON.stringify(events));
    });
  } catch (e) {
    next(e);
  }
});

async function renderActivityCombinedWithGroups(res, next, activity) {
  const render = function (groups) {
    memberstore.getMembersForIds(activity.editorIds(), (err, editors) => {
      if (err || !editors) {
        return next(err);
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
    });
  };

  if (res.locals.accessrights.isSuperuser()) {
    const allGroups = await groupstore.allGroups();
    return render(allGroups);
  }

  // API geändert von email() auf member und Methode umbenannt
  const subscribedGroups = await groupsService.getSubscribedGroupsForMember(res.locals.user.member);
  return render(Group.regionalsFrom(subscribedGroups).concat(Group.thematicsFrom(subscribedGroups)));
}

app.get("/new", (req, res, next) => renderActivityCombinedWithGroups(res, next, new Activity()));

app.get("/newLike/:url", (req, res, next) => {
  activitystore.getActivity(req.params.url, (err, activity) => {
    if (err || activity === null) {
      return next(err);
    }
    renderActivityCombinedWithGroups(res, next, activity.resetForClone());
  });
});

app.get("/edit/:url", (req, res, next) => {
  activitiesService.getActivityWithGroupAndParticipants(req.params.url, (err, activity) => {
    if (err || activity === null) {
      return next(err);
    }
    if (activity.isSoCraTes()) {
      return res.redirect(activity.fullyQualifiedUrl());
    }
    if (!res.locals.accessrights.canEditActivity(activity)) {
      return res.redirect("/activities/" + encodeURIComponent(req.params.url));
    }
    renderActivityCombinedWithGroups(res, next, activity);
  });
});

app.post("/submit", (req, res, next) => {
  async.parallel(
    [
      (callback) => {
        validation.checkValidity(
          req.body.previousUrl.trim(),
          req.body.url.trim(),
          R.partial(activitiesService.isValidUrl, [reservedURLs]),
          req.i18n.t("validation.url_not_available"),
          callback
        );
      },
      (callback) => {
        const errors = validation.isValidForActivity(req.body);
        return callback(null, errors);
      },
    ],
    (err, errorMessages) => {
      if (err) {
        return next(err);
      }
      const realErrors = R.flatten(errorMessages).filter((message) => message);
      if (realErrors.length === 0) {
        return activitySubmitted(req, res, next);
      }
      return res.render("../../../views/errorPages/validationError", { errors: realErrors });
    }
  );
});

app.post("/clone-from-meetup", (req, res, next) => {
  meetupActivitiesService.cloneActivitiesFromMeetup((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/activities");
  });
});

app.get("/checkurl", (req, res) =>
  misc.validate(req.query.url, req.query.previousUrl, R.partial(activitiesService.isValidUrl, [reservedURLs]), res.end)
);

app.get("/:url", (req, res, next) => {
  activitiesService.getActivityWithGroupAndParticipants(req.params.url, (err, activity) => {
    if (err || !activity) {
      return next(err);
    }
    if (activity.isSoCraTes()) {
      return res.redirect(activity.fullyQualifiedUrl());
    }
    memberstore.getMembersForIds(activity.editorIds(), (err1, editors) => {
      if (err1 || !editors) {
        return next(err1);
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
  });
});

function subscribe(body, req, res, next) {
  const activityUrl = body.url;

  activitiesService.addVisitorTo(req.user.member.id(), activityUrl, Date.now(), (err, statusTitle, statusText) => {
    if (err) {
      return next(err);
    }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else {
      statusmessage
        .successMessage("message.title.save_successful", "message.content.activities.participation_added")
        .putIntoSession(req);
    }
    res.redirect("/activities/" + encodeURIComponent(activityUrl));
  });
}

app.post("/subscribe", (req, res, next) => subscribe(req.body, req, res, next));

app.get("/subscribe", (req, res, next) => {
  // in case the call was redirected via login, we get called with "get"
  const body = req.session.previousBody;
  if (!body) {
    return next();
  }
  delete req.session.previousBody;
  subscribe(body, req, res, next);
});

app.post("/unsubscribe", (req, res, next) => {
  // unsubscribe can only be called when user is already logged in
  const activityUrl = req.body.url;
  activitiesService.removeVisitorFrom(req.user.member.id(), activityUrl, (err, statusTitle, statusText) => {
    if (err) {
      return next(err);
    }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else {
      statusmessage
        .successMessage("message.title.save_successful", "message.content.activities.participation_removed")
        .putIntoSession(req);
    }
    res.redirect("/activities/" + encodeURIComponent(activityUrl));
  });
});

function addToWaitinglist(body, req, res, next) {
  activitiesService.addToWaitinglist(req.user.member.id(), body.url, Date.now(), (err, statusTitle, statusText) => {
    if (err) {
      return next(err);
    }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else {
      statusmessage
        .successMessage("message.title.save_successful", "message.content.activities.waitinglist_added")
        .putIntoSession(req);
    }
    res.redirect("/activities/" + encodeURIComponent(body.url));
  });
}

app.post("/addToWaitinglist", (req, res, next) => {
  addToWaitinglist(req.body, req, res, next);
});

app.get("/addToWaitinglist", (req, res, next) => {
  // in case the call was redirected via login, we get called with "get"
  const body = req.session.previousBody;
  if (!body) {
    return next();
  }
  delete req.session.previousBody;
  addToWaitinglist(body, req, res, next);
});

app.post("/removeFromWaitinglist", (req, res, next) => {
  // removeFromWaitinglist can only be called when user is already logged in
  activitiesService.removeFromWaitinglist(req.user.member.id(), req.body.url, (err, statusTitle, statusText) => {
    if (err) {
      return next(err);
    }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else {
      statusmessage
        .successMessage("message.title.save_successful", "message.content.activities.waitinglist_removed")
        .putIntoSession(req);
    }
    res.redirect("/activities/" + encodeURIComponent(req.body.url));
  });
});

app.post("/delete", (req, res, next) => {
  const url = req.body.activityUrl;
  activitystore.getActivity(url, (err, activity) => {
    if (err || !activity) {
      return next(err);
    }
    if (!res.locals.accessrights.canDeleteActivity(activity)) {
      return res.redirect("/activities/" + encodeURIComponent(url));
    }
    activitystore.removeActivity(activity, (err1) => {
      if (err1) {
        return next(err1);
      }
      statusmessage
        .successMessage("message.title.save_successful", "message.content.activities.deleted")
        .putIntoSession(req);
      res.redirect("/activities/");
    });
  });
});

module.exports = app;
