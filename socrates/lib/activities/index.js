'use strict';

var async = require('async');
var _ = require('lodash');
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var activitiesService = beans.get('activitiesService');
var activitystore = beans.get('activitystore');

var Activity = beans.get('activity');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var roomOptions = beans.get('roomOptions');
var addonService = beans.get('addonService');
var currentUrl = beans.get('socratesConstants').currentUrl;

var reservedURLs = '^new$|^edit$|^submit$|^checkurl$\\+';

var app = misc.expressAppIn(__dirname);

function activitySubmitted(req, res, next) {
  if (req.body.previousUrl && req.body.url !== req.body.previousUrl) {
    statusmessage.errorMessage('message.title.conflict', 'To create a new SoCraTes activity for a different year, please use "New".').putIntoSession(req);
    return res.redirect('/registration/');
  }
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

app.get('/new', function (req, res) {
  var resources = {};
  _.each(roomOptions.allIds, function (id) {
    resources[id] = {_canUnsubscribe: false, _waitinglist: true};
  });
  var activity = new Activity({
    resources: resources
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

// for management tables:

app.get('/addons', function (req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(currentUrl, function (err, activity) {
    if (!res.locals.accessrights.canEditActivity(activity)) {
      return res.redirect('/registration');
    }

    addonService.addonLinesOf(activity, function (err, addonLines) {
      if (err) { return next(err); }

      var formatDates = function (dates) {
        return _(dates).map(function (date) { return date.locale('de').format('L'); }).uniq().value();
      };
      var formatList = function (list) {
        return list.join(', ');
      };

      var tshirtSizes = addonService.tshirtSizes(addonLines);

      res.render('managementTables', {
        activity: activity,
        addonLines: addonLines,
        addonLinesOfUnsubscribedMembers: [],
        tshirtsizes: tshirtSizes,
        formatDates: formatDates,
        formatList: formatList
      });
    });
  });
});

app.get('/paymentReceived/:nickname', function (req, res) {
  addonService.submitPaymentReceived(req.params.nickname, function (err) {
    if (err) { return res.send('Error: ' + err); }
    res.send(moment().locale(res.locals.language).format('L'));
  });
});

module.exports = app;
