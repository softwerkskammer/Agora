'use strict';

var moment = require('moment-timezone');
var async = require('async');
var _ = require('lodash');

var conf = require('simple-configure');
var beans = conf.get('beans');
var misc = beans.get('misc');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var activitiesService = beans.get('activitiesService');
var calendarService = beans.get('calendarService');
var icalService = beans.get('icalService');
var groupsService = beans.get('groupsService');
var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');

var Activity = beans.get('activity');
var Group = beans.get('group');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var resourceRegistrationRenderer = beans.get('resourceRegistrationRenderer');

var standardResourceName = Activity.standardName;
var reservedURLs = conf.get('reservedActivityURLs');

var app = misc.expressAppIn(__dirname);

function editorNameOf(member) {
  return member.displayName() + ' (' + member.nickname() + ')'.replace(',', '');
}

function activitySubmitted(req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.body.previousUrl, function (err, activity) {
    if (err) { return next(err); }
    if (!activity) { activity = new Activity({owner: req.user.member.id()}); }
    var trimmedEditors = misc.toArray(req.body.editorIds);
    var editorIds = _.map(trimmedEditors, function (editor) {
      var memberRepresentingTheEditor = _.find(activity.participants, function (participant) { return editorNameOf(participant) === editor; });
      return memberRepresentingTheEditor ? memberRepresentingTheEditor.id() : undefined;
    });
    editorIds = _.compact(editorIds);
    activity.fillFromUI(req.body, editorIds);
    activitystore.saveActivity(activity, function (err1) {
      if (err1 && err1.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        statusmessage.errorMessage('message.title.conflict', 'message.content.save_error_retry').putIntoSession(req);
        return res.redirect('/activities/edit/' + encodeURIComponent(activity.url()));
      }
      if (err1) { return next(err1); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.saved').putIntoSession(req);
      res.redirect('/activities/' + encodeURIComponent(activity.url()));
    });
  });
}

function activitiesForDisplay(activitiesFetcher, next, res, title) {
  return activitiesService.getActivitiesForDisplay(activitiesFetcher, function (err, activities) {
    if (err) { next(err); }
    res.render('index', {
      activities: activities,
      range: title,
      webcalURL: conf.get('publicUrlPrefix').replace('http', 'webcal') + '/activities/ical'
    });
  });
}

function sendCalendarStringNamedToResult(ical, filename, res) {
  res.type('text/calendar; charset=utf-8');
  res.header('Content-Disposition', 'inline; filename=' + filename + '.ics');
  res.send(ical.toString());
}

app.get('/', function (req, res, next) {
  activitiesForDisplay(activitystore.allActivities, next, res, req.i18n.t('general.all'));
});

function renderGdcrFor(gdcrDate, res, next) {
  var gdcrActivities = _.partial(activitiesService.activitiesBetween, gdcrDate, gdcrDate.clone().add(1, 'days'));

  return activitiesService.getActivitiesForDisplay(gdcrActivities, function (err, activities) {
    if (err) { next(err); }
    var gdcrYear = gdcrDate.year();
    res.render('gdcr', {
      calViewYear: gdcrYear,
      calViewMonth: gdcrDate.month(),
      activities: activities,
      year: String(gdcrYear),
      previousYears: _.range(2013, gdcrYear).map(function (year) { return String(year); })
    });
  });
}
app.get('/gdcr2013', function (req, res, next) {
  return renderGdcrFor(moment('2013-12-14', 'YYYY-MM-DD'), res, next);
});

app.get('/gdcr2014', function (req, res, next) {
  return renderGdcrFor(moment('2014-11-15', 'YYYY-MM-DD'), res, next);
});

app.get('/gdcr', function (req, res, next) {
  return renderGdcrFor(moment('2015-11-14', 'YYYY-MM-DD'), res, next);
});

app.get('/upcoming', function (req, res, next) {
  activitiesForDisplay(activitystore.upcomingActivities, next, res, req.i18n.t('activities.upcoming'));
});

app.get('/past', function (req, res, next) {
  activitiesForDisplay(activitystore.pastActivities, next, res, req.i18n.t('activities.past'));
});

app.get('/ical', function (req, res, next) {
  activitystore.upcomingActivities(function (err, activities) {
    if (err || !activities) { return next(err); }
    sendCalendarStringNamedToResult(icalService.icalForActivities(activities), 'events', res);
  });
});

app.get('/icalForGroup/:group', function (req, res, next) {
  activitystore.upcomingActivities(function (err, activities) {
    if (err || !activities) { return next(err); }
    var groupsActivities = _.filter(activities, function (activity) { return activity.assignedGroup() === req.params.group; });
    sendCalendarStringNamedToResult(icalService.icalForActivities(groupsActivities), 'events', res);
  });
});

app.get('/ical/:url', function (req, res, next) {
  activitystore.getActivity(req.params.url, function (err, activity) {
    if (err || !activity) { return next(err); }
    sendCalendarStringNamedToResult(icalService.activityAsICal(activity), activity.url(), res);
  });
});

app.get('/eventsForSidebar', function (req, res, next) {
  var from = moment(req.query.start).utc();
  if (from.date() > 1) { from.add(1, 'M'); }
  req.session.calViewYear = from.year();
  req.session.calViewMonth = from.month();

  var start = moment(req.query.start).utc();
  var end = moment(req.query.end).utc();

  async.parallel(
    {
      groupColors: function (callback) { groupsService.allGroupColors(callback); }
    },
    function (err, collectedColors) {
      if (err) { next(err); }
      calendarService.eventsBetween(start, end, collectedColors.groupColors, function (err1, events) {
        if (err1) { return next(err1); }
        res.end(JSON.stringify(events));
      });
    }
  );
});

function renderActivityCombinedWithGroups(res, next, activity) {
  var render = function (groups) {
    memberstore.getMembersForIds(activity.editorIds(), function (err, editors) {
      if (err || !editors) { return next(err); }
      var editorNames = _.map(editors, editorNameOf);
      _.remove(activity.participants || [], function (participant) { return participant.nickname() === activity.ownerNickname; });
      var participantNames = _.map(activity.participants || [], editorNameOf);
      res.render('edit', {
        activity: activity,
        groups: groups,
        editorNames: editorNames,
        participantNames: participantNames
      });
    });
  };

  if (res.locals.accessrights.isSuperuser()) {
    return groupsService.getAllAvailableGroups(function (err, allGroups) {
      if (err) { return next(err); }
      return render(allGroups);
    });
  }

  groupsService.getSubscribedGroupsForUser(res.locals.user.member.email(), function (err, subscribedGroups) {
    if (err) { return next(err); }
    return render(Group.regionalsFrom(subscribedGroups).concat(Group.thematicsFrom(subscribedGroups)));
  });
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
  activitiesService.getActivityWithGroupAndParticipants(req.params.url, function (err, activity) {
    if (err || activity === null) { return next(err); }
    if (activity.isSoCraTes()) {
      return res.redirect(activity.fullyQualifiedUrl());
    }
    if (!res.locals.accessrights.canEditActivity(activity)) {
      return res.redirect('/activities/' + encodeURIComponent(req.params.url));
    }
    renderActivityCombinedWithGroups(res, next, activity);
  });
});

app.post('/submit', function (req, res, next) {

  async.parallel(
    [
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (url, cb) { activitiesService.isValidUrl(reservedURLs, url, cb); };
        validation.checkValidity(req.body.previousUrl.trim(), req.body.url.trim(), validityChecker, req.i18n.t('validation.url_not_available'), callback);
      },
      function (callback) {
        var errors = validation.isValidForActivity(req.body);
        return callback(null, errors);
      }
    ],
    function (err, errorMessages) {
      if (err) { return next(err); }
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

app.get('/:url', function (req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.params.url, function (err, activity) {
    if (err || !activity) { return next(err); }
    if (activity.isSoCraTes()) {
      return res.redirect(activity.fullyQualifiedUrl());
    }
    memberstore.getMembersForIds(activity.editorIds(), function (err1, editors) {
      if (err1 || !editors) { return next(err1); }
      var editorNicknames = _.map(editors, function (editor) { return editor.nickname(); });
      var allowsRegistration = _.every(activity.resources().resourceNames(), function (resourceName) {
        return activity.resourceNamed(resourceName).limit() !== 0;
      });
      res.render('get', {
        activity: activity,
        allowsRegistration: allowsRegistration,
        editorNicknames: editorNicknames,
        resourceRegistrationRenderer: resourceRegistrationRenderer,
        calViewYear: activity.year(),
        calViewMonth: activity.month()
      });
    });
  });
});

function subscribe(body, req, res, next) {
  var resourceName = body.resource;
  var activityUrl = body.url;

  activitiesService.addVisitorTo(req.user.member.id(), activityUrl, resourceName, moment(), function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else if (resourceName === standardResourceName) {
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_added').putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_for_resource_added', {resourceName: resourceName}).putIntoSession(req);
    }
    res.redirect('/activities/' + encodeURIComponent(activityUrl));
  });
}
app.post('/subscribe', function (req, res, next) {
  subscribe(req.body, req, res, next);
});

app.get('/subscribe/:activity/:resource', function (req, res) {
  // TODO: remove in June 2015 - just here for legacy invitation emails
  res.redirect('/activities/' + encodeURIComponent(req.params.activity));
});

app.get('/subscribe', function (req, res, next) {
  // in case the call was redirected via login, we get called with "get"
  var body = req.session.previousBody;
  if (!body) { return next(); }
  delete req.session.previousBody;
  subscribe(body, req, res, next);
});

app.post('/unsubscribe', function (req, res, next) { // unsubscribe can only be called when user is already logged in
  var resourceName = req.body.resource;
  var activityUrl = req.body.url;
  activitiesService.removeVisitorFrom(req.user.member.id(), activityUrl, resourceName, function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else if (resourceName === standardResourceName) {
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_removed').putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_for_resource_removed', {resourceName: resourceName}).putIntoSession(req);
    }
    res.redirect('/activities/' + encodeURIComponent(activityUrl));
  });
});

function addToWaitinglist(body, req, res, next) {
  activitiesService.addToWaitinglist(req.user.member.id(), body.url, body.resource, moment(), function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.waitinglist_added').putIntoSession(req);
    }
    res.redirect('/activities/' + encodeURIComponent(body.url));
  });
}

app.post('/addToWaitinglist', function (req, res, next) {
  // in case the call was redirected via login, we get called with "get"
  addToWaitinglist(req.body, req, res, next);
});

app.get('/addToWaitinglist', function (req, res, next) {
  var body = req.session.previousBody;
  if (!body) { return next(); }
  delete req.session.previousBody;
  addToWaitinglist(body, req, res, next);
});

app.post('/removeFromWaitinglist', function (req, res, next) { // removeFromWaitinglist can only be called when user is already logged in
  activitiesService.removeFromWaitinglist(req.user.member.id(), req.body.url, req.body.resource, function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.waitinglist_removed').putIntoSession(req);
    }
    res.redirect('/activities/' + encodeURIComponent(req.body.url));
  });
});

app.get('/addons/:url', function (req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.params.url, function (err, activity) {
    if (err) { return next(err); }
    if (!res.locals.accessrights.canEditActivity(activity)) {
      return res.redirect('/activities/' + encodeURIComponent(req.params.url));
    }
    res.render('managementTables', {activity: activity});
  });
});

app.post('/delete', function (req, res, next) {
  var url = req.body.activityUrl;
  activitystore.getActivity(url, function (err, activity) {
    if (err || !activity) { return next(err); }
    if (!res.locals.accessrights.canDeleteActivity(activity)) {
      return res.redirect('/activities/' + encodeURIComponent(url));
    }
    activitystore.removeActivity(activity, function (err1) {
      if (err1) { return next(err1); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.deleted').putIntoSession(req);
      res.redirect('/activities/');
    });
  });
});

module.exports = app;
