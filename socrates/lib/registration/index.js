'use strict';
var moment = require('moment-timezone');
var _ = require('lodash');

var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var Member = beans.get('member');
var mailsenderService = beans.get('mailsenderService');
var subscriberstore = beans.get('subscriberstore');
var activitiesService = beans.get('activitiesService');
var registrationService = beans.get('registrationService');
var icalService = beans.get('icalService');
var activitystore = beans.get('activitystore');
var statusmessage = beans.get('statusmessage');
var memberSubmitHelper = beans.get('memberSubmitHelper');
var socratesConstants = beans.get('socratesConstants');

var app = misc.expressAppIn(__dirname);

function isRegistrationOpen() { // we currently set this to false on production system, because this feature is still in development
  return app.get('env') !== 'production';
}

function roomOptions() {
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
      four: 4 * base + 3 * day
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
    res.render('get', {activity: activity, roomOptions: roomOptions(), registrationPossible: isRegistrationOpen()});
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

// TODO noch nicht freigeschaltete Funktionalitäten:

function participate(registrationTuple, req, res, next) {
  if (!req.user) { return res.redirect('/registration'); }
  var member = req.user.member || new Member().initFromSessionUser(req.user, true);
  delete req.session.registrationTuple;
  subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
    if (err) { return next(err); }
    res.render('participate', {member: member, addon: subscriber.addon(), registrationTuple: registrationTuple});
  });
}

app.post('/startRegistration', function (req, res, next) {
  if (!isRegistrationOpen() || !req.body.nightsOptions) { return res.redirect('/registration'); }
  var option = req.body.nightsOptions.split(',');
  var registrationTuple = {
    activityUrl: req.body.activityUrl,
    resourceName: option[0],
    duration: option[1],
    sessionID: req.sessionID
  };
  registrationService.startRegistration(registrationTuple, function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
      return res.redirect('/registration');
    }
    if (!req.user) {
      var returnToUrl = '/registration/participate';
      req.session.registrationTuple = registrationTuple;
      req.session.returnToUrl = returnToUrl;
      return res.render('loginForRegistration', {returnToUrl: returnToUrl});
    }
    participate(registrationTuple, req, res, next);
  });
});

app.get('/participate', function (req, res, next) {
  var registrationTuple = req.session.registrationTuple;
  if (!registrationTuple) { return res.redirect('/registration'); }
  participate(registrationTuple, req, res, next);
});

app.post('/completeRegistration', function (req, res, next) {
  memberSubmitHelper(req, res, function (err) {
    if (err) { return next(err); }
    var body = req.body;
    registrationService.saveRegistration(req.user.member.id(), req.sessionID, body, function (err, statusTitle, statusText) {
      if (err) { return next(err); }
      if (statusTitle && statusText) {
        delete req.session.statusmessage;
        statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
        return res.redirect('/registration');
      }
      res.redirect('/');
    });
  });
});

app.get('/resign', function (req, res) {
  if (req.user.member) {
    return res.render('compose-resign', {nickname: req.user.member.nickname()});
  }
  return res.render('/');
});

app.post('/submitresign', function (req, res, next) {
  var markdown = '**' + req.i18n.t('mailsender.why-resign') + '**\n' + req.body.why + '\n\n**' + req.i18n.t('mailsender.notes-resign') + '**\n' + req.body.notes;
  return mailsenderService.sendResignment(markdown, req.user.member, function (err, statusmsg) {
    statusmsg.putIntoSession(req);
    res.redirect('/');
  });
});

module.exports = app;
