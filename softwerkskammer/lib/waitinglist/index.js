const async = require("async");

const beans = require("simple-configure").get("beans");

const waitinglistService = beans.get("waitinglistService");
const activitiesService = beans.get("activitiesService");
const memberstore = beans.get("memberstore");
const misc = beans.get("misc");

async function accessAllowedTo(activityUrl, res, callback) {
  const accessrights = res.locals.accessrights;

  try {
    const activity = await activitiesService.getActivityWithGroupAndParticipants(activityUrl);
    const canEditActivity = !!activity && accessrights.canEditActivity(activity);
    if (!canEditActivity) {
      return callback();
    }
    return callback(null, activity);
  } catch (e) {
    callback(e);
  }
}

const app = misc.expressAppIn(__dirname);

app.get("/:activityUrl", (req, res, next) => {
  const activityUrl = req.params.activityUrl;
  accessAllowedTo(activityUrl, res, (err, activity) => {
    if (err || !activity) {
      return res.redirect("/activities/upcoming");
    }
    waitinglistService.waitinglistFor(activityUrl, (err1, waitinglist) => {
      if (err1) {
        return next(err1);
      }
      res.render("waitinglistTable", { waitinglist, activity });
    });
  });
});

app.post("/add", (req, res, next) => {
  const activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, (err, activity) => {
    if (err || !activity) {
      return res.redirect("/activities/upcoming");
    }

    const args = { nickname: req.body.nickname, activityUrl };
    waitinglistService.saveWaitinglistEntry(args, (err1) => {
      if (err1) {
        return next(err1);
      }
      res.redirect("/waitinglist/" + encodeURIComponent(activityUrl));
    });
  });
});

app.post("/allowRegistration", (req, res, next) => {
  const activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, (err, activity) => {
    if (err || !activity) {
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

    async.eachSeries(rows, waitinglistService.allowRegistrationForWaitinglistEntry, (err1) => {
      if (err1) {
        return next(err1);
      }
      res.redirect("/waitinglist/" + encodeURIComponent(activityUrl));
    });
  });
});

app.post("/remove", (req, res, next) => {
  const activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, async (err, activity) => {
    if (err) {
      return next(err);
    }
    if (!res.locals.accessrights.canEditActivity(activity)) {
      res.redirect("/activites/" + encodeURIComponent(req.body.activityUrl));
    }
    try {
      const member = await memberstore.getMember(req.body.nickname);
      activitiesService.removeFromWaitinglist(member.id(), activityUrl, (err2) => {
        if (err2) {
          return next(err2);
        }
        res.send("ok");
      });
    } catch (e) {
      return res.send(400);
    }
  });
});

module.exports = app;
