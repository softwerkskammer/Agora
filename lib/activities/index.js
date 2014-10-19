'use strict';

var moment = require('moment-timezone');
var async = require('async');
var _ = require('lodash');

var conf = require('nconf');
var beans = conf.get('beans');
var misc = beans.get('misc');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;
var activitiesService = beans.get('activitiesService');
var addonService = beans.get('addonService');
var calendarService = beans.get('calendarService');
var icalService = beans.get('icalService');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');
var paymentService = beans.get('paymentService');
var fieldHelpers = beans.get('fieldHelpers');

var PaymentInfo = beans.get('paymentInfo'); // muss wieder raus hier
var Activity = beans.get('activity');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var resourceRegistrationRenderer = beans.get('resourceRegistrationRenderer');

var standardResourceName = Activity.standardName;
var reservedURLs = '^gdcr$|^upcoming$|^past$|^ical$|^eventsForSidebar$|^new$|^newLike$|^edit$|^submit$|^checkurl$|^subscribe$|^unsubscribe$|^addToWaitinglist$|^removeFromWaitinglist$|\\+';

var app = misc.expressAppIn(__dirname);

function activitySubmitted(req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.body.previousUrl, function (err, activity) {
    if (err) { return next(err); }
    if (!activity) { activity = new Activity({owner: req.user.member.id()}); }
    var trimmedEditors = _.map(misc.toArray(req.body.editorIds.split(",")), function (editor) { return editor.trim(); });
    var editorIds = _.map(trimmedEditors, function (editor) {
      var memberRepresentingTheEditor = _.find(activity.participants, function (participant) { return editorNameOf(participant) === editor; });
      return memberRepresentingTheEditor ? memberRepresentingTheEditor.id() : undefined;
    });
    editorIds = _.compact(editorIds);
    activity.fillFromUI(req.body, editorIds);
    activitystore.saveActivity(activity, function (err) {
      if (err && err.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        statusmessage.errorMessage('message.title.conflict', 'message.content.save_error_retry').putIntoSession(req);
        return res.redirect('/activities/edit/' + encodeURIComponent(activity.url()));
      }
      if (err) { return next(err); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.saved').putIntoSession(req);
      res.redirect('/activities/' + encodeURIComponent(activity.url()));
    });
  });
}

function activitiesForDisplay(activitiesFetcher, next, res, title) {
  return activitiesService.getActivitiesForDisplay(activitiesFetcher, function (err, activities) {
    if (err) { next(err); }
    res.render('index', { activities: activities, range: title, webcalURL: conf.get('publicUrlPrefix').replace('http', 'webcal') + '/activities/ical' });
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
    res.render('gdcr', { calViewYear: gdcrYear, calViewMonth: gdcrDate.month(),
      activities: activities, year: String(gdcrYear), previousYears: _.range(2013, gdcrYear).map(function (year) { return String(year); })});
  });
}
app.get('/gdcr2013', function (req, res, next) {
  return renderGdcrFor(moment('2013-12-14', 'YYYY-MM-DD'), res, next);
});

app.get('/gdcr', function (req, res, next) {
  return renderGdcrFor(moment('2014-11-15', 'YYYY-MM-DD'), res, next);
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
  var from = moment.unix(req.query.start).utc();
  if (from.date() > 1) { from.add('M', 1); }
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
      calendarService.eventsBetween(start, end, collectedColors.groupColors, function (err, events) {
        if (err) { return next(err); }
        res.end(JSON.stringify(events));
      });
    }
  );
});

function editorNameOf(member) {
  return member.displayName() + " (" + member.nickname() + ")".replace(",", "");
}

function renderActivityCombinedWithGroups(res, next, activity) {
  var callback = function (err, groups) {
    if (err) { return next(err); }
    memberstore.getMembersForIds(activity.editorIds(), function (err, editors) {
      if (err || !editors) { return next(err); }
      var editorNames = _.map(editors, editorNameOf);
      _.remove(activity.participants || [], function (participant) { return participant.nickname() === activity.ownerNickname; });
      var participantNames = _.map(activity.participants || [], editorNameOf);
      res.render('edit', { activity: activity, groups: groups, editorNames: editorNames, participantNames: participantNames });
    });
  };

  if (res.locals.accessrights.isSuperuser()) {
    return groupsService.getAllAvailableGroups(callback);
  }
  groupsService.getSubscribedGroupsForUser(res.locals.user.member.email(), callback);
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

app.get('/payment/:url', function (req, res, next) {
  activitystore.getActivity(req.params.url, function (err, activity) {
    if (err || !activity) { return next(err); }
    var addonConfig = activity.addonConfig();
    res.render('payment', {
      activity: activity,
      addonConfig: addonConfig,
      fee: fieldHelpers.formatNumberWithCurrentLocale(res, paymentService.calcFee(addonConfig.deposit())) + ' €',
      paymentInfo: new PaymentInfo(activity.addonForMember(req.user.member.id()).state)
    });
  });
});

app.post('/payment/submitTransfer', function (req, res, next) {
  var url = req.body.id;
  addonService.payWithTransfer(url, req.user.member.id(), function (err) {
    if (err) { return next(err); }
    statusmessage.successMessage('message.title.save_successful', 'message.content.activities.transfer_paid').putIntoSession(req);
    res.redirect('/activities/' + encodeURIComponent(url));
  });
});

app.post('/payment/submitCreditCard', function (req, res, next) {
  var url = req.body.id;
  addonService.payWithCreditCard(url, parseFloat(req.body.amount.replace(',', '.')), req.user.member.id(), req.body.stripeId, req.body.description, function (err, message) {
    if (err) { return next(err); }
    message.putIntoSession(req);
    res.redirect('/activities/' + encodeURIComponent(url));
  });
});

app.get('/addon/:url', function (req, res, next) {
  var url = req.params.url;
  addonService.addonForMember(url, req.user.member.id(), function (err, addon, addonConfig) {
    if (err) { return next(err); }
    res.render('addon', { url: url, addon: addon, addonConfig: addonConfig });
  });
});

app.post('/submitAddon', function (req, res, next) {
  var url = req.body.url;
  activitiesService.getActivityWithGroupAndParticipants(url, function (err, activity) {
    var errors = validation.isValidForAddon(req.body, activity.addonConfig());
    var realErrors = _.filter(_.flatten(errors), function (message) { return !!message; });
    if (realErrors.length > 0) {
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
    addonService.saveAddon(url, req.user.member.id(), req.body, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.addon.saved').putIntoSession(req);
      res.redirect('/activities/' + encodeURIComponent(url));
    });
  });
});

app.get('/:url', function (req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.params.url, function (err, activity) {
    var canEditAddon = false;
    var addonAlreadyFilled = false;
    var hasToBePaid = false;
    var paymentAlreadyDone = false;
    if (err || !activity) { return next(err); }
    if (req.user) {
      var memberID = req.user.member.id();
      addonAlreadyFilled = validation.isValidForAddon(activity.addonForMember(memberID).state, activity.addonConfig()).length === 0;
      canEditAddon = activity.hasAddonConfig() && _.find(activity.participants, function (participant) {
        return participant.id() === memberID;
      });
      hasToBePaid = canEditAddon && !!activity.addonConfig().deposit();
      paymentAlreadyDone = activity.addonForMember(memberID).paymentDone();
    }
    memberstore.getMembersForIds(activity.editorIds(), function (err, editors) {
      if (err || !editors) { return next(err); }
      var editorNicknames = _.map(editors, function (editor) { return editor.nickname(); });
      res.render('get', { activity: activity, editorNicknames: editorNicknames, resourceRegistrationRenderer: resourceRegistrationRenderer,
        calViewYear: activity.year(), calViewMonth: activity.month(),
        canEditAddon: canEditAddon, addonAlreadyFilled: addonAlreadyFilled,
        hasToBePaid: hasToBePaid, paymentAlreadyDone: paymentAlreadyDone});
    });
  });
});

app.get('/subscribe/:url/default', function (req, res) {
  // for backwards compatibility only
  res.redirect('/activities/subscribe/' + encodeURIComponent(req.params.url) + '/' + standardResourceName);
});

app.get('/subscribe/:url/:resource', function (req, res, next) {
  var resourceName = req.params.resource;
  var activityUrl = req.params.url;
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
});

app.get('/subscribe/:url', function (req, res) {
  // for backwards compatibility only
  res.redirect('/activities/subscribe/' + encodeURIComponent(req.params.url) + '/' + standardResourceName);
});

app.get('/unsubscribe/:url/:resource', function (req, res, next) {
  var resourceName = req.params.resource;
  var activityUrl = req.params.url;
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

app.get('/addToWaitinglist/:activityUrl/:resourceName', function (req, res, next) {
  activitiesService.addToWaitinglist(req.user.member.id(), req.params.activityUrl, req.params.resourceName, moment(), function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.waitinglist_added').putIntoSession(req);
    }
    res.redirect('/activities/' + encodeURIComponent(req.params.activityUrl));
  });
});

app.get('/removeFromWaitinglist/:activityUrl/:resourceName', function (req, res, next) {
  activitiesService.removeFromWaitinglist(req.user.member.id(), req.params.activityUrl, req.params.resourceName, function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
    } else {
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.waitinglist_removed').putIntoSession(req);
    }
    res.redirect('/activities/' + encodeURIComponent(req.params.activityUrl));
  });
});

app.get('/addons/:url', function (req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(req.params.url, function (err, activity) {
    if (!res.locals.accessrights.canEditActivity(activity)) {
      return res.redirect('/activities/' + encodeURIComponent(req.params.url));
    }
    groupsAndMembersService.addMembersToGroup(activity.group, function (err) {
      if (err) { return next(err); }

      addonService.addonLinesOf(activity, function (err, addonLines) {
        if (err) { return next(err); }

        var containsMember = function (group, member) {
          return _.some(group.members, function (memberInGroup) { return memberInGroup.id() === member.id(); });
        };
        var formatDates = function (dates) {
          return _(dates).map(function (date) { return date.locale(res.locals.language).format('L'); }).uniq().value();
        };
        var formatList = function (list) {
          return list.join(', ');
        };

        addonService.addonLinesOfUnsubscribedMembers(activity, function (err, addonLinesOfUnsubscribedMembers) {
          if (err) { return next(err); }
          var tshirtSizes = addonService.tshirtSizes(addonLines);

          res.render('managementTables', {activity: activity, addonLines: addonLines,
            addonLinesOfUnsubscribedMembers: addonLinesOfUnsubscribedMembers, tshirtsizes: tshirtSizes,
            containsMember: containsMember, formatDates: formatDates, formatList: formatList});
        });
      });
    });
  });
});

app.get('/paymentReceived/:activityUrl/:nickname', function (req, res) {
  var url = req.params.activityUrl;
  activitystore.getActivity(url, function (err, activity) {
    if (err || !activity) { return res.send('Error: ' + err); }
    if (!res.locals.accessrights.canEditActivity(activity)) {
      return res.redirect('/activities/' + encodeURIComponent(url));
    }
    addonService.submitPaymentReceived(url, req.params.nickname, function (err) {
      if (err) { return res.send('Error: ' + err); }
      res.send(moment().locale(res.locals.language).format('L'));
    });
  });
});

app.get('/delete/:activityUrl', function (req, res, next) {
  var url = req.params.activityUrl;
  activitystore.getActivity(url, function (err, activity) {
    if (err || !activity) { return next(err); }
    if (!res.locals.accessrights.canDeleteActivity(activity)) {
      return res.redirect('/activities/' + encodeURIComponent(url));
    }
    activitystore.removeActivity(activity, function (err) {
      if (err) { return next(err); }
      statusmessage.successMessage('message.title.save_successful', 'message.content.activities.deleted').putIntoSession(req);
      res.redirect('/activities/');
    });
  });
});

module.exports = app;
