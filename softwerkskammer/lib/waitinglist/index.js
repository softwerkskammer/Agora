"use strict";
const beans = require("simple-configure").get("beans");

const waitinglistService = require("../waitinglist/waitinglistService");
const activitiesService = require("../activities/activitiesService");
const memberstore = require("../members/memberstore");
const misc = beans.get("misc");

function accessAllowedTo(activityUrl, res) {
  const accessrights = res.locals.accessrights;

  const activity = activitiesService.getActivityWithGroupAndParticipants(activityUrl);
  const canEditActivity = !!activity && accessrights.canEditActivity(activity);
  if (!canEditActivity) {
    return;
  }
  return activity;
}

const app = misc.expressAppIn(__dirname);

app.get("/:activityUrl", (req, res) => {
  const activityUrl = req.params.activityUrl;
  try {
    const activity = accessAllowedTo(activityUrl, res);
    if (!activity) {
      return res.redirect("/activities/upcoming");
    }
    const waitinglist = waitinglistService.waitinglistFor(activityUrl);
    res.render("waitinglistTable", { waitinglist, activity });
  } catch (e) {
    return res.redirect("/activities/upcoming");
  }
});

app.post("/add", (req, res) => {
  const activityUrl = req.body.activityUrl;
  try {
    const activity = accessAllowedTo(activityUrl, res);
    if (!activity) {
      return res.redirect("/activities/upcoming");
    }
    const args = { nickname: req.body.nickname, activityUrl };
    waitinglistService.saveWaitinglistEntry(args);
    res.redirect("/waitinglist/" + encodeURIComponent(activityUrl));
  } catch (e) {
    return res.redirect("/activities/upcoming");
  }
});

app.post("/allowRegistration", (req, res) => {
  const activityUrl = req.body.activityUrl;
  const activity = accessAllowedTo(activityUrl, res);
  if (!activity) {
    return res.redirect("/activities/upcoming");
  }
  let selectedRow = req.body.selectedRow;
  if (!selectedRow) {
    return res.redirect("/waitinglist/" + encodeURIComponent(activityUrl));
  }
  const selectedRows = selectedRow instanceof Array ? selectedRow : [selectedRow];

  const rows = selectedRows.map((rowString) => {
    const result = JSON.parse(rowString);
    result.hoursstring = req.body.registrationValidForHours;
    return result;
  });
  rows.forEach(waitinglistService.allowRegistrationForWaitinglistEntry);
  res.redirect("/waitinglist/" + encodeURIComponent(activityUrl));
});

app.post("/remove", (req, res, next) => {
  const activityUrl = req.body.activityUrl;
  const activity = accessAllowedTo(activityUrl, res);

  if (!res.locals.accessrights.canEditActivity(activity)) {
    res.redirect("/activites/" + encodeURIComponent(req.body.activityUrl));
  }
  try {
    const member = memberstore.getMember(req.body.nickname);
    try {
      activitiesService.removeFromWaitinglist(member.id(), activityUrl);
    } catch (e) {
      return next(e);
    }
    res.send("ok");
  } catch (e) {
    res.sendStatus(400);
  }
});

module.exports = app;
