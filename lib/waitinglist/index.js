"use strict";

var path = require('path');
var moment = require('moment-timezone');
var async = require('async');

var conf = require('nconf');
var beans = conf.get('beans');

var store = beans.get('waitinglistStore');
var membersAPI = beans.get('membersAPI');
var WaitinglistEntry = beans.get('waitinglistEntry');

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
    store.waitinglist(function (err, waitinglist) {
      if (err) { return next(err); }
      async.each(waitinglist, function (waitinglistEntry, callback) {
        membersAPI.getMemberForId(waitinglistEntry.registrantId(), function (err, member) {
          if (err || !member) { return callback(err); }
          waitinglistEntry.registrantNickname = member.nickname;
          callback(null);
        });
      }, function (err) {
        if (err) { return next(err); }
        res.render('waitinglistTable', { waitinglist: waitinglist });
      });
    });
  });

  app.post('/submit', function (req, res, next) {
    var activity = req.body.activity;
    if (accessForbiddenTo(activity, res)) {
      return res.redirect('/activities/upcoming');
    }
    membersAPI.getMember(req.body.nickname, function (err, member) {
      if (err) { return next(err); }
      var hoursString = req.body.registrationValidForHours;
      var entry = new WaitinglistEntry({
        _registrantId: member.id,
        _activityName: req.body.activity,
        _resourceName: req.body.resource,
        _registrationDate: moment().toDate()
      });
      entry.setRegistrationValidityFor(hoursString);
      store.saveWaitinglistEntry(entry, function (err) {
        if (err) { return next(err); }
        res.redirect('/waitinglist/waitinglistTable');
      });
    });
  });

  return app;
};

