const beans = require("simple-configure").get("beans");

const waitinglistService = beans.get("waitinglistService");
const activitiesService = beans.get("activitiesService");
const memberstore = beans.get("memberstore");
const misc = beans.get("misc");

async function accessAllowedTo(activityUrl, res) {
  const accessrights = res.locals.accessrights;

  const activity = await activitiesService.getActivityWithGroupAndParticipants(activityUrl);
  const canEditActivity = !!activity && accessrights.canEditActivity(activity);
  if (!canEditActivity) {
    return;
  }
  return activity;
}

const app = misc.expressAppIn(__dirname);

app.get("/:activityUrl", async (req, res) => {
  const activityUrl = req.params.activityUrl;
  try {
    const activity = await accessAllowedTo(activityUrl, res);
    if (!activity) {
      return res.redirect("/activities/upcoming");
    }
    const waitinglist = await waitinglistService.waitinglistFor(activityUrl);
    res.render("waitinglistTable", { waitinglist, activity });
  } catch (e) {
    return res.redirect("/activities/upcoming");
  }
});

app.post("/add", async (req, res) => {
  const activityUrl = req.body.activityUrl;
  try {
    const activity = await accessAllowedTo(activityUrl, res);
    if (!activity) {
      return res.redirect("/activities/upcoming");
    }
    const args = { nickname: req.body.nickname, activityUrl };
    await waitinglistService.saveWaitinglistEntry(args);
    res.redirect("/waitinglist/" + encodeURIComponent(activityUrl));
  } catch (e) {
    return res.redirect("/activities/upcoming");
  }
});

app.post("/allowRegistration", async (req, res) => {
  const activityUrl = req.body.activityUrl;
  const activity = await accessAllowedTo(activityUrl, res);
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
  const all = rows.map(waitinglistService.allowRegistrationForWaitinglistEntry);
  await Promise.all(all);
  res.redirect("/waitinglist/" + encodeURIComponent(activityUrl));
});

app.post("/remove", async (req, res, next) => {
  const activityUrl = req.body.activityUrl;
  const activity = await accessAllowedTo(activityUrl, res);

  if (!res.locals.accessrights.canEditActivity(activity)) {
    res.redirect("/activites/" + encodeURIComponent(req.body.activityUrl));
  }
  try {
    const member = await memberstore.getMember(req.body.nickname);
    try {
      await activitiesService.removeFromWaitinglist(member.id(), activityUrl);
    } catch (e) {
      return next(e);
    }
    res.send("ok");
  } catch (e) {
    res.send(400);
  }
});

module.exports = app;
