"use strict";

var path = require('path');

var async = require('async');
var _ = require('underscore');
var conf = require('nconf');
var beans = conf.get('beans');

//var util = require('util');

var waitinglistAPI = beans.get('waitinglistAPI');
var activitystore = beans.get('activitystore');

function accessAllowedTo(activityUrl, res, callback) {
  var accessrights = res.locals.accessrights;

  activitystore.getActivity(activityUrl, function (err, activity) {
    var canEditActivity = !!activity && (accessrights.isSuperuser() || accessrights.canEditActivity(activity));
    if (err || !canEditActivity) { return callback(err); }
    return callback(null, activity);
  });
}

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  app.get('/:activityUrl', function (req, res, next) {
    var activityUrl = req.params.activityUrl;
    accessAllowedTo(activityUrl, res, function (err, activity) {
      if (err || !activity) { return res.redirect('/activities/upcoming'); }
      waitinglistAPI.waitinglistFor(activityUrl, function (err, waitinglist) {
        if (err) { return next(err); }
        res.render('waitinglistTable', { waitinglist: waitinglist, activity: activity });
      });
    });
  });

  app.post('/add', function (req, res, next) {
    var activityUrl = req.body.activityUrl;
    accessAllowedTo(activityUrl, res, function (err, activity) {
      if (err || !activity) { return res.redirect('/activities/upcoming'); }

      var resourcename = req.body.resourceName || activity.resourceNames()[0];
      var args = {nickname: req.body.nickname, activityUrl: activityUrl, resourcename: resourcename};
      waitinglistAPI.saveWaitinglistEntry(args, function (err) {
        if (err) { return next(err); }
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

      async.eachSeries(rows, waitinglistAPI.allowRegistrationForWaitinglistEntry, function (err) {
        if (err) { return next(err); }
        res.redirect('/waitinglist/' + encodeURIComponent(activityUrl));
      });
    });
  });

  return app;
};

