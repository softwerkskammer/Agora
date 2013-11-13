"use strict";

var path = require('path');
var moment = require('moment-timezone');
var icalendar = require('icalendar');
var async = require('async');
var _ = require('underscore');

var beans = require('nconf').get('beans');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var activitiesCoreAPI = beans.get('activitiesCoreAPI');
  var activitiesAPI = beans.get('activitiesAPI');
  var groupsAPI = beans.get('groupsAPI');
  var colorsAPI = beans.get('colorAPI');
  var Activity = beans.get('activity');
  var standardResourceName = Activity.standardName;

  function activitySubmitted(req, res, next) {
    activitiesCoreAPI.getActivity(req.body.previousUrl, function (err, activity) {
      if (err) { return next(err); }
      if (!activity) { activity = new Activity({owner: req.user.member.id}); }
      activity.fillFromUI(req.body);
      activitiesCoreAPI.saveActivity(activity, function (err, savedActivity) {
        if (err) { return next(err); }
        statusmessage.successMessage('Speichern erfolgreich', 'Deine Aktivität wurde gespeichert.').putInSession(req);
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
    activitiesForDisplay(activitiesCoreAPI.allActivities, next, res, 'Alle');
  });

  app.get('/upcoming', function (req, res, next) {
    activitiesForDisplay(activitiesCoreAPI.upcomingActivities, next, res, 'Kommende');
  });

  app.get('/past', function (req, res, next) {
    activitiesForDisplay(activitiesCoreAPI.pastActivities, next, res, 'Vergangene');
  });

  app.get('/ical', function (req, res, next) {
    activitiesCoreAPI.upcomingActivities(function (err, activities) {
      if (err || activities === null) { return next(err); }
      var ical = new icalendar.iCalendar();
      _.each(activities, function (act) {
        var ev = act.asICal();
        ical.addComponent(ev);
      });
      sendCalendarStringNamedToResult(ical, 'events', res);
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
      { groupColors: function (callback) { groupsAPI.allColors(callback); },
        colors: function (callback) { colorsAPI.allColors(callback); }
      },
      function (err, collectedColors) {
        if (err) { next(err); }
        activitiesCoreAPI.eventsBetween(start, end, collectedColors.groupColors, collectedColors.colors, function (err, events) {
          if (err) { return next(err); }
          res.end(JSON.stringify(events));
        });
      });
  });

  function renderActivityCombinedWithGroupsAndColors(res, next, activity) {
    groupsAPI.getAllAvailableGroups(function (err, groups) {
      if (err) { return next(err); }
      colorsAPI.allColors(function (err, colors) {
        if (err) { next(err); }
        var colorlist = _.map(colors, function (color) { return color.id; });
        colorlist.unshift('aus Gruppe');
        res.render('edit', { activity: activity, groups: groups, colorlist: colorlist });
      });
    });
  }

  app.get('/new', function (req, res, next) {
    renderActivityCombinedWithGroupsAndColors(res, next, new Activity());
  });

  app.get('/newLike/:url', function (req, res, next) {
    activitiesCoreAPI.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) { return next(err); }
      renderActivityCombinedWithGroupsAndColors(res, next, activity.resetForClone());
    });
  });

  app.get('/edit/:url', function (req, res, next) {
    activitiesCoreAPI.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) { return next(err); }
      if (!res.locals.accessrights.canEditActivity(activity)) {
        return res.redirect('/activities/' + encodeURIComponent(req.params.url));
      }
      renderActivityCombinedWithGroupsAndColors(res, next, activity);
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
      var currentUserId = req.user ? req.user.member.id : '';
      res.render('get', { activity: activity, currentUserId: currentUserId, calViewYear: activity.year(), calViewMonth: activity.month()});
    });
  });

  app.get('/ical/:url', function (req, res, next) {
    activitiesCoreAPI.getActivity(req.params.url, function (err, activity) {
      if (err || !activity) { return next(err); }
      sendCalendarStringNamedToResult(activity.asICal(), activity.url(), res);
    });
  });

  app.get('/subscribe/:url/default', function (req, res) {
    // for backwards compatibility only
    res.redirect('/activities/subscribe/' + encodeURIComponent(req.params.url) + '/' + standardResourceName);
  });

  app.get('/subscribe/:url/:resource', function (req, res, next) {
    var resource = req.params.resource;
    activitiesCoreAPI.addVisitorTo(req.user.member.id, req.params.url, resource, function (err) {
      if (err) { return next(err); }
      if (resource === standardResourceName) {
        statusmessage.successMessage('Speichern erfolgreich', 'Deine Teilnahme wurde eingetragen.').putInSession(req);
      } else {
        statusmessage.successMessage('Speichern erfolgreich', 'Deine Teilnahme wurde für "' + resource + '" eingetragen.').putInSession(req);
      }
      res.redirect('/activities/' + encodeURIComponent(req.params.url));
    });
  });

  app.get('/subscribe/:url', function (req, res) {
    // for backwards compatibility only
    res.redirect('/activities/subscribe/' + encodeURIComponent(req.params.url) + '/' + standardResourceName);
  });

  app.get('/unsubscribe/:url/:resource', function (req, res, next) {
    var resource = req.params.resource;
    activitiesCoreAPI.removeVisitorFrom(req.user.member.id, req.params.url, resource, function (err) {
      if (err) { return next(err); }
      if (resource === standardResourceName) {
        statusmessage.successMessage('Speichern erfolgreich', 'Schade, dass Du nicht dabei sein wirst.').putInSession(req);
      } else {
        statusmessage.successMessage('Speichern erfolgreich', 'Schade, dass Du bei "' + resource + '" nicht dabei sein wirst.').putInSession(req);
      }
      res.redirect('/activities/' + encodeURIComponent(req.params.url));
    });
  });

  return app;
};
