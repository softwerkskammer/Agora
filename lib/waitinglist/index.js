"use strict";

var path = require('path');

var conf = require('nconf');
var beans = conf.get('beans');

//var util = require('util');

var waitinglistAPI = beans.get('waitinglistAPI');
var activitystore = beans.get('activitystore');

function accessAllowedTo(activityUrl, res, callback) {
  if (res.locals.accessrights.isSuperuser()) { return callback(null, true); } // superuser is always allowed
  if (!activityUrl) { return callback(null, false); } // not superuser and no activityUrl -> no access

  activitystore.getActivity(activityUrl, function (err, activity) {
    if (err || !activity) { return callback(err, false); }
    return callback(null, res.locals.accessrights.canEditActivity(activity));
  });
}


module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');


  app.get('/waitinglistTable/:activityUrl', function (req, res, next) {
    accessAllowedTo(req.params.activityUrl, res, function (err, accessAllowed) {
      if (err || !accessAllowed) { return res.redirect('/activities/upcoming'); }
      waitinglistAPI.waitinglistFor(req.params.activityUrl, function (err, waitinglist) {
        if (err) { return next(err); }
        res.render('waitinglistTable', { waitinglist: waitinglist, accessrights: res.locals.accessrights });
      });
    });
  });

  app.get('/waitinglistTable', function (req, res, next) {
    accessAllowedTo(null, res, function (err, accessAllowed) {
      if (err || !accessAllowed) { return res.redirect('/activities/upcoming'); }
      waitinglistAPI.waitinglist(function (err, waitinglist) {
        if (err) { return next(err); }
        res.render('waitinglistTable', { waitinglist: waitinglist, accessrights: res.locals.accessrights });
      });
    });
  });

  app.post('/submit', function (req, res, next) {
    var activityUrl = req.body.activityUrl;
    accessAllowedTo(activityUrl, res, function (err, accessAllowed) {
      if (err || !accessAllowed) { return res.redirect('/activities/upcoming'); }

      var nickname = req.body.nickname || req.user.member.nickname;
      var args = {nickname: nickname, activityUrl: activityUrl, resourcename: req.body.resourceName, hoursstring: req.body.registrationValidForHours};
      waitinglistAPI.saveWaitinglistEntry(args, function (err) {
        if (err) { return next(err); }
        res.redirect('/waitinglist/waitinglistTable');
      });
    });
  });

  return app;
};

