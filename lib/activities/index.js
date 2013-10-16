"use strict";

var path = require('path');
var moment = require('moment-timezone');
var icalendar = require('icalendar');
var async = require('async');
var _ = require('underscore');

var beans = require('nconf').get('beans');
var validation = beans.get('validation');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var activitiesCoreAPI = beans.get('activitiesCoreAPI');
  var activitiesAPI = beans.get('activitiesAPI');
  var groupsAPI = beans.get('groupsAPI');
  var colorsAPI = beans.get('colorAPI');
  var membersAPI = beans.get('membersAPI');
  var Activity = beans.get('activity');

  function activitySubmitted(req, res, next) {
    activitiesCoreAPI.getActivity(req.body.url, function (err, activity) {
      if (err) { return next(err); }
      if (!activity) { activity = new Activity(); }
      activity.fillFromUI(req.body);
      activitiesCoreAPI.saveActivity(activity, function (err, savedActivity) {
        if (err) { return next(err); }
        res.redirect('/activities/' + encodeURIComponent(savedActivity.url));
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
        var activity = new Activity().fillFromUI(req.body);
        var errors = validation.isValidActivity(activity);
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
    async.parallel({
        activity: function (callback) { activitiesCoreAPI.getActivity(req.params.url, callback); },
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); },
        members: function (callback) { membersAPI.allMembers(callback); }
      },
      function (err, results) {
        if (err || !results.activity) { return next(err); }
        var activity = results.activity;
        var visitors = [];
        _.each(activity.resourceNames(), function (resourceName) {
          if (activity.registeredMembers(resourceName)) {
            visitors.push(results.members.filter(function (member) {
              return activity.registeredMembers(resourceName).indexOf(member.id) > -1;
            }));
          }
        });
        visitors = _.flatten(visitors);
        visitors = _.uniq(visitors);
        res.render('get', { activity: activity, groups: results.groups,
          calViewYear: activity.year(), calViewMonth: activity.month(),
          visitors: visitors});
      });
  });

  app.get('/ical/:url', function (req, res, next) {
    activitiesCoreAPI.getActivity(req.params.url, function (err, activity) {
      if (err || !activity) { return next(err); }
      sendCalendarStringNamedToResult(activity.asICal(), activity.url, res);
    });
  });

  app.get('/subscribe/:url/:resource', function (req, res, next) {
    activitiesCoreAPI.addVisitorTo(req.user.member.id, req.params.url, req.params.resource, function (err) {
      if (err) { return next(err); }
      res.redirect('/activities/' + encodeURIComponent(req.params.url));
    });
  });

  app.get('/subscribe/:url', function (req, res, next) {
    activitiesCoreAPI.addVisitorTo(req.user.member.id, req.params.url, 'default', function (err) {
      if (err) { return next(err); }
      res.redirect('/activities/' + encodeURIComponent(req.params.url));
    });
  });

  app.get('/unsubscribe/:url/:resource', function (req, res, next) {
    activitiesCoreAPI.removeVisitorFrom(req.user.member.id, req.params.url, req.params.resource, function (err) {
      if (err) { return next(err); }
      res.redirect('/activities/' + encodeURIComponent(req.params.url));
    });
  });

  return app;
};
