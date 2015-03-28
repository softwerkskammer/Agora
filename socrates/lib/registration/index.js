'use strict';
var moment = require('moment-timezone');
var _ = require('lodash');

var conf = require('simple-configure');
var beans = conf.get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var Member = beans.get('member');
var subscriberstore = beans.get('subscriberstore');
var activitiesService = beans.get('activitiesService');
var registrationService = beans.get('registrationService');
var icalService = beans.get('icalService');
var activitystore = beans.get('activitystore');
var statusmessage = beans.get('statusmessage');
var memberSubmitHelper = beans.get('memberSubmitHelper');
var socratesConstants = beans.get('socratesConstants');
var Addon = beans.get('socratesAddon');

var app = misc.expressAppIn(__dirname);

function isRegistrationOpen() {
  // we currently set this to false on production system, because this feature is still in development
  // the conf variable is used as a backdoor for testing
  return app.get('env') !== 'production' && !conf.get('registrationIsClosed');
}

function roomOptions(activity, memberId) {
  var dinner = 13;
  var day = 17;
  var single = 70 + dinner;
  var double = 50 + dinner;
  var junior = 46 + dinner;
  var juniorExclusive = 2 * 46 + dinner;

  function option(id, name, base) {
    return {
      id: id,
      name: name,
      two: 2 * base + 2 * day,
      three: 3 * base + 2 * day,
      threePlus: 3 * base + 3 * day,
      four: 4 * base + 3 * day,
      displayRegistrationCheckboxes: (activity.isAlreadyRegistered(memberId) || !isRegistrationOpen() || activity.resourceNamed(id).canSubscribe())
    };
  }

  return [
    option('single', 'Single', single),
    option('bed_in_double', 'Double shared …', double),
    option('bed_in_junior', 'Junior shared …', junior),
    option('junior', 'Junior (exclusive)', juniorExclusive)
  ];
}

app.get('/', function (req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(socratesConstants.currentUrl, function (err, activity) {
    if (err || !activity) { return next(err); }
    var options = roomOptions(activity, res.locals.accessrights.memberId());
    res.render('get', {activity: activity, roomOptions: options, registrationPossible: isRegistrationOpen()});
  });
});

app.get('/ical', function (req, res, next) {
  function sendCalendarStringNamedToResult(ical, filename, res) {
    res.type('text/calendar; charset=utf-8');
    res.header('Content-Disposition', 'inline; filename=' + filename + '.ics');
    res.send(ical.toString());
  }

  activitystore.getActivity(socratesConstants.currentUrl, function (err, activity) {
    if (err || !activity) { return next(err); }
    sendCalendarStringNamedToResult(icalService.activityAsICal(activity), activity.url(), res);
  });
});

app.get('/interested', function (req, res) {
  res.render('iAmInterested');
});

// TODO noch nicht freigeschaltete Funktionalitäten:

app.post('/startRegistration', function (req, res, next) {
  if (!isRegistrationOpen() || !req.body.nightsOptions) { return res.redirect('/registration'); }
  var option = req.body.nightsOptions.split(',');
  var registrationTuple = {
    activityUrl: socratesConstants.currentUrl,
    resourceName: option[0],
    duration: option[1],
    sessionID: req.sessionID
  };
  var participateURL = '/registration/participate';
  req.session.registrationTuple = registrationTuple;
  registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
      return res.redirect('/registration');
    }
    if (!req.user) {
      req.session.returnToUrl = participateURL;
      return res.render('loginForRegistration', {returnToUrl: participateURL});
    }
    res.redirect(participateURL);
  });
});

app.get('/participate', function (req, res, next) {
  var registrationTuple = req.session.registrationTuple;
  if (!registrationTuple) { return res.redirect('/registration'); }
  if (!req.user) { return res.redirect('/registration'); }
  var member = req.user.member || new Member().initFromSessionUser(req.user, true);

  activitiesService.getActivityWithGroupAndParticipants(socratesConstants.currentUrl, function (err, activity) {
    if (err || !activity) { return next(err); }
    if (activity.isAlreadyRegistered(member.id())) {
      statusmessage.successMessage('general.info', 'activities.already_registered').putIntoSession(req);
      return res.redirect('/registration');
    }
    subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
      if (err) { return next(err); }
      var addon = (subscriber && subscriber.addon()) || new Addon({});
      res.render('participate', {member: member, addon: addon, registrationTuple: registrationTuple});
    });
  });
});

app.post('/completeRegistration', function (req, res, next) {
  memberSubmitHelper(req, res, function (err) {
    if (err) { return next(err); }
    var body = req.body;
    registrationService.saveRegistration(req.user.member.id(), req.sessionID, body, function (err, statusTitle, statusText) {
      if (err) { return next(err); }
      delete req.session.statusmessage;
      if (statusTitle && statusText) {
        statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
        return res.redirect('/registration');
      }
      statusmessage.successMessage('general.info', 'activities.successfully_registered').putIntoSession(req);
      res.redirect('/payment/socrates');
    });
  });
});

module.exports = app;
