'use strict';

const async = require('async');

const beans = require('simple-configure').get('beans');

const waitinglistService = beans.get('waitinglistService');
const activitiesService = beans.get('activitiesService');
const memberstore = beans.get('memberstore');
const misc = beans.get('misc');

function accessAllowedTo(activityUrl, res, callback) {
  const accessrights = res.locals.accessrights;

  activitiesService.getActivityWithGroupAndParticipants(activityUrl, (err, activity) => {
    const canEditActivity = !!activity && accessrights.canEditActivity(activity);
    if (err || !canEditActivity) { return callback(err); }
    return callback(null, activity);
  });
}

const app = misc.expressAppIn(__dirname);

app.get('/:activityUrl', (req, res, next) => {
  const activityUrl = req.params.activityUrl;
  accessAllowedTo(activityUrl, res, (err, activity) => {
    if (err || !activity) { return res.redirect('/activities/upcoming'); }
    waitinglistService.waitinglistFor(activityUrl, (err1, waitinglist) => {
      if (err1) { return next(err1); }
      res.render('waitinglistTable', {waitinglist: waitinglist, activity: activity});
    });
  });
});

app.post('/add', (req, res, next) => {
  const activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, (err, activity) => {
    if (err || !activity) { return res.redirect('/activities/upcoming'); }

    const args = {nickname: req.body.nickname, activityUrl: activityUrl};
    waitinglistService.saveWaitinglistEntry(args, err1 => {
      if (err1) { return next(err1); }
      res.redirect('/waitinglist/' + encodeURIComponent(activityUrl));
    });
  });
});

app.post('/allowRegistration', (req, res, next) => {
  const activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, (err, activity) => {
    if (err || !activity) { return res.redirect('/activities/upcoming'); }

    let selectedRow = req.body.selectedRow;
    if (!selectedRow) { return res.redirect('/waitinglist/' + encodeURIComponent(activityUrl)); }
    const selectedRows = selectedRow instanceof Array ? selectedRow : [selectedRow];

    const rows = selectedRows.map(rowString => {
      const result = JSON.parse(rowString);
      result.hoursstring = req.body.registrationValidForHours;
      return result;
    });

    async.eachSeries(rows, waitinglistService.allowRegistrationForWaitinglistEntry, err1 => {
      if (err1) { return next(err1); }
      res.redirect('/waitinglist/' + encodeURIComponent(activityUrl));
    });
  });
});

app.post('/remove', (req, res, next) => {
  const activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, (err, activity) => {
    if (err) { return next(err); }
    if (!res.locals.accessrights.canEditActivity(activity)) {
      res.redirect('/activites/' + encodeURIComponent(req.body.activityUrl));
    }
    memberstore.getMember(req.body.nickname, (err1, member) => {
      if (err1) { return res.send(400); }
      activitiesService.removeFromWaitinglist(member.id(), activityUrl, err2 => {
        if (err2) { return next(err2); }
        res.send('ok');
      });
    });
  });
});

module.exports = app;
