"use strict";

var path = require('path');
var moment = require('moment');
var async = require('async');
var _ = require('underscore');
var conf = require('nconf');

var validation = conf.get('beans').get('validation');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var api = conf.get('beans').get('activitiesAPI');
  var groupsAPI = conf.get('beans').get('groupsAPI');
  var colorsAPI = conf.get('beans').get('colorAPI');
  var membersAPI = conf.get('beans').get('membersAPI');
  var Activity = conf.get('beans').get('activity');

  function activitySubmitted(req, res, next) {
    var activity = new Activity(req.body);
    var errors = validation.isValidActivity(activity);
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }
    api.saveActivity(activity, function (err) {
      if (err) { return next(err); }
      res.redirect('/activities/' + encodeURIComponent(activity.url));
    });
  }

  function activitiesForDisplay(activitesFetcher, next, res, title) {
    async.parallel(
      { activities: activitesFetcher,
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); },
        colors: function (callback) { colorsAPI.allColors(callback); },
        groupColors: function (callback) { groupsAPI.allColors(callback); }
      },
      function (err, results) {
        if (err) { next(err); }
        res.render('index', { activities: results.activities, groups: results.groups,
          groupColors: results.groupColors, colors: results.colors, range: title });
      });
  }

  app.get('/', function (req, res, next) {
    var activitesFetcher = function (callback) { api.allActivities(callback); };
    var title = 'Alle';
    activitiesForDisplay(activitesFetcher, next, res, title);
  });

  app.get('/upcoming', function (req, res, next) {
    var activitesFetcher = function (callback) { api.upcomingActivities(callback); };
    var title = 'Kommende';
    activitiesForDisplay(activitesFetcher, next, res, title);
  });

  app.get('/past', function (req, res, next) {
    var activitesFetcher = function (callback) { api.pastActivities(callback); };
    var title = 'Vergangene';
    activitiesForDisplay(activitesFetcher, next, res, title);
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
        api.eventsBetween(start, end, collectedColors.groupColors, collectedColors.colors, function (err, events) {
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
    api.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) { return next(err); }
      activity.id = null;
      activity.url = null;
      activity.registeredMembers = [];
      renderActivityCombinedWithGroupsAndColors(res, next, activity);
    });
  });

  app.get('/edit/:url', function (req, res, next) {
    api.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) { return next(err); }
      renderActivityCombinedWithGroupsAndColors(res, next, activity);
    });
  });

  app.post('/submit', function (req, res, next) {
    var url = req.body.url;
    var previousUrl = req.body.previousUrl;
    if (url !== previousUrl) {
      return api.isValidUrl(url, function (err, check) {
        if (err || !check) {
          var errors = ['Diese URL ist leider nicht verfügbar.'];
          return res.render('../../../views/errorPages/validationError', {errors: errors});
        }
        activitySubmitted(req, res, next);
      });
    }
    activitySubmitted(req, res, next);
  });

  app.get('/checkurl', function (req, res) {
    var url = req.query.url;
    var previousUrl = req.query.previousUrl;
    if (url === previousUrl) { return res.end('true'); }
    api.isValidUrl(url, function (err, result) {
      if (err) { return res.end('false'); }
      res.end(result.toString());
    });
  });

  app.get('/:url', function (req, res, next) {
    async.parallel({
        activity: function (callback) { api.getActivity(req.params.url, callback); },
        groups: function (callback) { groupsAPI.getAllAvailableGroups(callback); },
        members: function (callback) { membersAPI.allMembers(callback); }
      },
      function (err, results) {
        if (err || !results.activity) { return next(err); }
        var activity = results.activity;
        var visitors = [];
        if (activity.registeredMembers) {
          visitors = results.members.filter(function (member) {
            return activity.registeredMembers.indexOf(member.id) > -1;
          });
        }
        res.render('get', { activity: activity, groups: results.groups,
          calViewYear: activity.year(), calViewMonth: activity.month(),
          visitors: visitors});
      });
  });

  app.get('/ical/:url', function (req, res, next) {
    api.getActivity(req.params.url, function (err, activity) {
      if (err || activity === null) { return next(err); }
      res.type('text/calendar');
      res.header('Content-Disposition', 'inline; filename=' + activity.url + '.ics');
      res.send(activity.asICal().toString());
    });
  });

  app.get('/subscribe/:url', function (req, res, next) {
    api.addVisitorTo(req.user.member.id, req.params.url, function (err) {
      if (err) { return next(err); }
      res.redirect('/activities/' + encodeURIComponent(req.params.url));
    });
  });

  app.get('/unsubscribe/:url', function (req, res, next) {
    api.removeVisitorFrom(req.user.member.id, req.params.url, function (err) {
      if (err) { return next(err); }
      res.redirect('/activities/' + encodeURIComponent(req.params.url));
    });
  });

  return app;
}
;
