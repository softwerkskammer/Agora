"use strict";

var path = require('path');

var conf = require('nconf');
var beans = conf.get('beans');

var waitinglistAPI = beans.get('waitinglistAPI');

function accessForbiddenTo(activity, res) {
  return !res.locals.accessrights.isSuperuser() && !!activity && !res.locals.accessrights.canEditActivity(activity);
}


module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');


  app.get('/waitinglistTable', function (req, res, next) {
    if (accessForbiddenTo(null, res)) {
      return res.redirect('/activities/upcoming');
    }
    waitinglistAPI.waitinglist(function (err, waitinglist) {
      if (err) { return next(err); }
      res.render('waitinglistTable', { waitinglist: waitinglist });
    });


  });

  app.post('/submit', function (req, res, next) {
    var activity = req.body.activity;
    if (accessForbiddenTo(activity, res)) {
      return res.redirect('/activities/upcoming');
    }

    var args = {nickname: req.body.nickname, activityname: req.body.activity, resourcename: req.body.resource, hoursstring: req.body.registrationValidForHours};
    waitinglistAPI.saveWaitinglistEntry(args, function (err) {
      if (err) { return next(err); }
      res.redirect('/waitinglist/waitinglistTable');
    });
  });

  return app;
};

