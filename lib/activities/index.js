"use strict";

var path = require('path');
var moment = require('moment-timezone');
var async = require('async');
var _ = require('underscore');

var beans = require('nconf').get('beans');
var icalAPI = beans.get('icalAPI');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var resourceRegistrationRenderer = beans.get('resourceRegistrationRenderer');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var activitystore = beans.get('activitystore');
  var activitiesCoreAPI = beans.get('activitiesCoreAPI');
  var activitiesAPI = beans.get('activitiesAPI');
  var groupsAPI = beans.get('groupsAPI');
  var Activity = beans.get('activity');
  var standardResourceName = Activity.standardName;

  function activitySubmitted(req, res, next) {
    activitystore.getActivity(req.body.previousUrl, function (err, activity) {
      if (err) { return next(err); }
      if (!activity) { activity = new Activity({owner: req.user.member.id}); }
      activity.fillFromUI(req.body);
      activitiesCoreAPI.saveActivity(activity, function (err, savedActivity) {
        if (err) { return next(err); }
        statusmessage.successMessage('message.title.save_successful', 'message.content.activities.saved').putInSession(req);
        res.redirect('/activities/' + encodeURIComponent(savedActivity.url()));
      });
    });
  }

  function activitiesForDisplay(activitesFetcher, next, res, title) {
    return activitiesAPI.getActivitiesForDisplay(activitesFetcher, function (err, activities) {
      if (err) { next(err); }
      res.render('index', { activities: activities, range: title });
    });
  }

  function sendCalendarStringNamedToResult(ical, filename, res) {
    res.type('text/calendar; charset=utf-8');
    res.header('Content-Disposition', 'inline; filename=' + filename + '.ics');
    res.send(ical.toString());
  }

  app.get('/', function (req, res, next) {
    activitiesForDisplay(activitystore.allActivities, next, res, 'Alle');
  });

  app.get('/gdcr', function (req, res, next) {
    var gdcrDate = moment('2013-12-14');
    var gdcrDateAfter = moment('2013-12-15');

    var gdcrActivities = activitiesCoreAPI.activitiesBetween(gdcrDate, gdcrDateAfter);

    return activitiesAPI.getActivitiesForDisplay(gdcrActivities, function (err, activities) {
      if (err) { next(err); }
      res.render('gdcr', {activities: activities});
    });
  });

  app.get('/upcoming', function (req, res, next) {
    activitiesForDisplay(activitiesCoreAPI.upcomingActivities, next, res, 'Kommende');
  });

  app.get('/past', function (req, res, next) {
    activitiesForDisplay(activitiesCoreAPI.pastActivities, next, res, 'Vergangene');
  });

  app.get('/ical', function (req, res, next) {
    activitiesCoreAPI.upcomingActivities(function (err, activities) {
      if (err || !activities) { return next(err); }
      sendCalendarStringNamedToResult(icalAPI.icalForActivities(activities), 'events', res);
    });
  });

  app.get('/ical/:url', function (req, res, next) {
    activitystore.getActivity(req.params.url, function (err, activity) {
      if (err || !activity) { return next(err); }
      sendCalendarStringNamedToResult(icalAPI.activityAsICal(activity), activity.url(), res);
    });
  });

  app.get('/eventsForSidebar', function (req, res, next) {
    var from = moment.unix(req.query.start).utc();
    if (from.date() > 1) { from.add('M', 1); }
    req.session.calViewYear = from.year();
    req.session.calViewMonth = from.month();

    var start = moment.unix(req.query.start).utc();
    var end = moment.unix(req.query.end).utc();

    async.parallel(
      { groupColors: function (callback) { groupsAPI.allGroupColors(callback); }
      },
      function (err, collectedColors) {
        if (err) { next(err); }
        activitiesCoreAPI.eventsBetween(start, end, collectedColors.groupColors, function (err, events) {
          if (err) { return next(err); }
          res.end(JSON.stringify(events));
        });
      });
  });

  function renderActivityCombinedWithGroups(res, next, activity) {
    var callback = function (err, groups) {
      if (err) { return next(err); }
      res.render('edit', { activity: activity, groups: groups });
    };
    if (res.locals.accessrights.isSuperuser()) {
      return groupsAPI.getAllAvailableGroups(callback);
    }
    groupsAPI.getSubscribedGroupsForUser(res.locals.user.member.email, callback);
  }

  app.get('/new', function (req, res, next) {
    renderActivityCombinedWithGroups(res, next, new Activity());
  });

  app.get('/newLike/:url', function (req, res, next) {
    activitystore.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) { return next(err); }
      renderActivityCombinedWithGroups(res, next, activity.resetForClone());
    });
  });

  app.get('/edit/:url', function (req, res, next) {
    activitystore.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) { return next(err); }
      if (!res.locals.accessrights.canEditActivity(activity)) {
        return res.redirect('/activities/' + encodeURIComponent(req.params.url));
      }
      renderActivityCombinedWithGroups(res, next, activity);
    });
  });

  app.post('/submit', function (req, res, next) {

    async.parallel([
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (url, callback) { activitiesCoreAPI.isValidUrl(url, callback); };
        validation.checkValidity(req.body.previousUrl, req.body.url, validityChecker, 'Diese URL ist leider nicht verfügbar.', callback);
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
    var url = req.query.url;
    var previousUrl = req.query.previousUrl;
    if (url === previousUrl) { return res.end('true'); }
    activitiesCoreAPI.isValidUrl(url, function (err, result) {
      if (err) { return res.end('false'); }
      res.end(result.toString());
    });
  });

  app.get('/:url', function (req, res, next) {
    activitiesAPI.getActivityWithGroupAndParticipants(req.params.url, function (err, activity) {
      if (err || !activity) { return next(err); }
      res.render('get', { activity: activity, resourceRegistrationRenderer: resourceRegistrationRenderer, calViewYear: activity.year(), calViewMonth: activity.month()});
    });
  });

  app.get('/subscribe/:url/default', function (req, res) {
    // for backwards compatibility only
    res.redirect('/activities/subscribe/' + encodeURIComponent(req.params.url) + '/' + standardResourceName);
  });

  app.get('/subscribe/:url/:resource', function (req, res, next) {
    var resourceName = req.params.resource;
    var activityUrl = req.params.url;
    activitiesCoreAPI.addVisitorTo(req.user.member.id, activityUrl, resourceName, moment(), function (err, savedActivity, statusTitle, statusText) {
      if (err) { return next(err); }
      if (statusTitle && statusText) {
        statusmessage.errorMessage(statusTitle, statusText).putInSession(req);
      } else if (resourceName === standardResourceName) {
        statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_added').putInSession(req);
      } else {
        statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_for_resource_added', {resourceName: resourceName}).putInSession(req);
      }
      res.redirect('/activities/' + encodeURIComponent(activityUrl));
    });
  });

  app.get('/subscribe/:url', function (req, res) {
    // for backwards compatibility only
    res.redirect('/activities/subscribe/' + encodeURIComponent(req.params.url) + '/' + standardResourceName);
  });

  app.get('/unsubscribe/:url/:resource', function (req, res, next) {
    var resourceName = req.params.resource;
    activitiesCoreAPI.removeVisitorFrom(req.user.member.id, req.params.url, resourceName, function (err) {
      if (err) { return next(err); }
      if (resourceName === standardResourceName) {
        statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_removed').putInSession(req);
      } else {
        statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_for_resource_removed', {resourceName: resourceName}).putInSession(req);
      }
      res.redirect('/activities/' + encodeURIComponent(req.params.url));
    });
  });

  app.get('/addToWaitinglist/:activityUrl/:resourceName', function (req, res, next) {
    activitiesCoreAPI.addToWaitinglist(req.user.member.id, req.params.activityUrl, req.params.resourceName, moment(), function (err, savedActivity, statusTitle, statusText) {
      if (err) { return next(err); }
      if (statusTitle && statusText) {
        statusmessage.errorMessage(statusTitle, statusText).putInSession(req);
      } else {
        statusmessage.successMessage('message.title.save_successful', 'message.content.activities.waitinglist_added').putInSession(req);
        res.redirect('/activities/' + encodeURIComponent(req.params.activityUrl));
      }
    });
  });

  app.get('/removeFromWaitinglist/:activityUrl/:resourceName', function (req, res, next) {
    activitiesCoreAPI.removeFromWaitinglist(req.user.member.id, req.params.activityUrl, req.params.resourceName, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.waitinglist_removed').putInSession(req);
      res.redirect('/activities/' + encodeURIComponent(req.params.activityUrl));
    });
  });

  return app;
};
