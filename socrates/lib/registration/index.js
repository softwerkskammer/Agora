'use strict';
var moment = require('moment-timezone');

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
var SoCraTesResource = beans.get('socratesResource');

var app = misc.expressAppIn(__dirname);

var currentYear = 2015;
var currentUrl = 'socrates-' + currentYear;

app.get('/', function (req, res, next) {
  activitiesService.getActivityWithGroupAndParticipants(currentUrl, function (err, activity) {
    if (err || !activity) { return next(err); }
    var roomOptions = [
      {id: 'single', name: 'Single', two: 200, three: 270, threePlus: 300, four: 370},
      {id: 'bed_in_double', name: 'Double shared …', shareable: true, two: 160, three: 210, threePlus: 240, four: 290},
      {id: 'junior', name: 'Junior shared …', shareable: true, two: 151, three: 197, threePlus: 227, four: 272},
      {id: 'bed_in_junior', name: 'Junior (exclusive)', two: 242, three: 333, threePlus: 363, four: 454}
    ];
    res.render('get', {activity: activity, roomOptions: roomOptions});
  });
});

app.get('/ical', function (req, res, next) {
  function sendCalendarStringNamedToResult(ical, filename, res) {
    res.type('text/calendar; charset=utf-8');
    res.header('Content-Disposition', 'inline; filename=' + filename + '.ics');
    res.send(ical.toString());
  }

  activitystore.getActivity(currentUrl, function (err, activity) {
    if (err || !activity) { return next(err); }
    sendCalendarStringNamedToResult(icalService.activityAsICal(activity), activity.url(), res);
  });
});

// TODO noch nicht freigeschaltete Funktionalitäten:

function participate(registrationTupel, req, res, next) {
  if (!req.user) { return res.redirect('/registration'); }
  var member = req.user.member || new Member().initFromSessionUser(req.user, true);
  subscriberstore.getSubscriber(member.id(), function (err, subscriber) {
    if (err) { return next(err); }
    res.render('participate', {member: member, addon: subscriber.addon()});
  });
}

app.post('/startRegistration', function (req, res, next) {
  if (!req.body.nightsOptions) { return res.redirect('/registration'); }
  var option = req.body.nightsOptions.split(',');
  var registrationTupel = {activityUrl: req.body.activityUrl, resourceName: option[0], days: option[1]};
  var memberId = req.user ? req.user.member.id() : 'SessionID' + req.sessionID;
  registrationService.startRegistration(memberId, registrationTupel, function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
      return res.redirect('/registration');
    }
    if (!req.user) {
      var returnToUrl = '/registration/participate';
      req.session.registrationTupel = registrationTupel;
      req.session.returnToUrl = returnToUrl;
      return res.render('loginForRegistration', {returnToUrl: returnToUrl});
    }
    participate(registrationTupel, req, res, next);
  });
});

app.get('/participate', function (req, res, next) {
  var registrationTupel = req.session.registrationTupel;
  if (!registrationTupel) { return res.redirect('/registration'); }
  participate(registrationTupel, req, res, next);
});

app.post('/completeRegistration', function (req, res, next) {
  res.redirect('/');
  //statusmessage.successMessage('message.title.save_successful', 'message.content.activities.participation_for_resource_added', {resourceName: new SoCraTesResource().displayName(resourceName)}).putIntoSession(req);
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
