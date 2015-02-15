'use strict';

var moment = require('moment-timezone');
var async = require('async');
var _ = require('lodash');

var conf = require('simple-configure');
var beans = conf.get('beans');
var misc = beans.get('misc');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var activitiesService = beans.get('activitiesService');
var icalService = beans.get('icalService');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');
var paymentService = beans.get('paymentService');
var fieldHelpers = beans.get('fieldHelpers');

var Activity = beans.get('activity');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var resourceRegistrationRenderer = beans.get('resourceRegistrationRenderer');

var reservedURLs = '^ical$|^new$|^edit$|^submit$|^checkurl$|^subscribe$|^unsubscribe$|^addToWaitinglist$|^removeFromWaitinglist$|^socrates-$\\+';

var app = misc.expressAppIn(__dirname);

function activitySubmitted(req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.body.previousUrl, function (err, activity) {
    if (err) { return next(err); }
    if (!activity) { activity = new Activity({owner: req.user.member.id()}); }
    req.body.isSoCraTes = true; // mark activity as SoCraTes activity (important for SWK)
    activity.fillFromUI(req.body);
    activitystore.saveActivity(activity, function (err) {
      if (err && err.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        statusmessage.errorMessage('message.title.conflict', 'message.content.save_error_retry').putIntoSession(req);
        return res.redirect('/activities/edit/' + encodeURIComponent(activity.url()));
      }
      if (err) { return next(err); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.saved').putIntoSession(req);
      res.redirect('/registration/');
    });
  });
}

app.get('/new', function (req, res, next) {
  var activity = new Activity({
    resources: {
      single: {_canUnsubscribe: false},
      bed_in_double: {_canUnsubscribe: false},
      junior: {_canUnsubscribe: false},
      bed_in_junior: {_canUnsubscribe: false},
      waitinglist: {_canUnsubscribe: false, _waitinglist: true}
    }
  });
  res.render('edit', {activity: activity});
});

app.get('/edit/:url', function (req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.params.url, function (err, activity) {
    if (err || activity === null) { return next(err); }
    if (!res.locals.accessrights.canEditActivity(activity)) {
      return res.redirect('/registration/');
    }
    res.render('edit', {activity: activity});
  });
});

app.post('/submit', function (req, res, next) {
  var year = req.body.startDate.split('/')[2];
  req.body.title = 'SoCraTes ' + year;
  req.body.url = 'socrates-' + year;
  req.body.location = 'Soltau, Germany'; // important because it shows up in the iCal data :-)
  req.body.assignedGroup = 'G'; // required by SWK code

  async.parallel(
    [
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (url, callback) { activitiesService.isValidUrl(reservedURLs, url, callback); };
        validation.checkValidity(req.body.previousUrl.trim(), req.body.url.trim(), validityChecker, req.i18n.t('validation.url_not_available'), callback);
      },
      function (callback) {
        var errors = validation.isValidForActivity(req.body);
        return callback(null, errors);
      }
    ],
    function (err, errorMessages) {
      var realErrors = _.filter(_.flatten(errorMessages), function (message) { return !!message; });
      if (realErrors.length === 0) {
        return activitySubmitted(req, res, next);
      }
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
  );
});

app.get('/checkurl', function (req, res) {
  misc.validate(req.query.url, req.query.previousUrl, _.partial(activitiesService.isValidUrl, reservedURLs), res.end);
});

app.get('/ical/:url', function (req, res, next) {
  function sendCalendarStringNamedToResult(ical, filename, res) {
    res.type('text/calendar; charset=utf-8');
    res.header('Content-Disposition', 'inline; filename=' + filename + '.ics');
    res.send(ical.toString());
  }

  activitystore.getActivity(req.params.url, function (err, activity) {
    if (err || !activity) { return next(err); }
    sendCalendarStringNamedToResult(icalService.activityAsICal(activity), activity.url(), res);
  });
});

module.exports = app;
