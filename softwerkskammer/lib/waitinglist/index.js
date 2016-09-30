'use strict';

var async = require('async');
var _ = require('lodash');

var beans = require('simple-configure').get('beans');

var waitinglistService = beans.get('waitinglistService');
var activitiesService = beans.get('activitiesService');
var memberstore = beans.get('memberstore');
var misc = beans.get('misc');

function accessAllowedTo(activityUrl, res, callback) {
  var accessrights = res.locals.accessrights;

  activitiesService.getActivityWithGroupAndParticipants(activityUrl, function (err, activity) {
    var canEditActivity = !!activity && accessrights.canEditActivity(activity);
    if (err || !canEditActivity) { return callback(err); }
    return callback(null, activity);
  });
}

var app = misc.expressAppIn(__dirname);

app.get('/:activityUrl', function (req, res, next) {
  var activityUrl = req.params.activityUrl;
  accessAllowedTo(activityUrl, res, function (err, activity) {
    if (err || !activity) { return res.redirect('/activities/upcoming'); }
    waitinglistService.waitinglistFor(activityUrl, function (err1, waitinglist) {
      if (err1) { return next(err1); }
      res.render('waitinglistTable', { waitinglist: waitinglist, activity: activity });
    });
  });
});

app.post('/add', function (req, res, next) {
  var activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, function (err, activity) {
    if (err || !activity) { return res.redirect('/activities/upcoming'); }

    var args = {nickname: req.body.nickname, activityUrl: activityUrl};
    waitinglistService.saveWaitinglistEntry(args, function (err1) {
      if (err1) { return next(err1); }
      res.redirect('/waitinglist/' + encodeURIComponent(activityUrl));
    });
  });
});

app.post('/allowRegistration', function (req, res, next) {
  var activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, function (err, activity) {
    if (err || !activity) { return res.redirect('/activities/upcoming'); }

    var selectedRow = req.body.selectedRow;
    if (!selectedRow) { return res.redirect('/waitinglist/' + encodeURIComponent(activityUrl)); }
    var selectedRows = selectedRow instanceof Array ? selectedRow : [ selectedRow ];

    var rows = _.map(selectedRows, function (rowString) {
      var result = JSON.parse(rowString);
      result.hoursstring = req.body.registrationValidForHours;
      return result;
    });

    async.eachSeries(rows, waitinglistService.allowRegistrationForWaitinglistEntry, function (err1) {
      if (err1) { return next(err1); }
      res.redirect('/waitinglist/' + encodeURIComponent(activityUrl));
    });
  });
});

app.post('/remove', function (req, res, next) {
  var activityUrl = req.body.activityUrl;
  accessAllowedTo(activityUrl, res, function (err, activity) {
    if (err) { return next(err); }
    if (!res.locals.accessrights.canEditActivity(activity)) {
      res.redirect('/activites/' + encodeURIComponent(req.body.activityUrl));
    }
    memberstore.getMember(req.body.nickname, function (err1, member) {
      if (err1) { return res.send(400); }
      activitiesService.removeFromWaitinglist(member.id(), activityUrl, function (err2) {
        if (err2) { return next(err2); }
        res.send('ok');
      });
    });
  });
});

module.exports = app;
