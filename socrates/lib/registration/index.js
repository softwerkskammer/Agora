'use strict';
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
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
      {id: 'double', name: 'Double shared …', shareable: true, two: 160, three: 210, threePlus: 240, four: 290},
      {id: 'junior', name: 'Junior shared …', shareable: true, two: 151, three: 197, threePlus: 227, four: 272},
      {id: 'juniorAlone', name: 'Junior (exclusive)', two: 242, three: 333, threePlus: 363, four: 454}
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

app.post('/startRegistration', function (req, res, next) {

  // TODO was wenn derjenige nicht angemeldet ist? Soll trotzdem funktionieren!
  var resourceName = 'single'; //req.params.resource;
  var days = 'three';
  registrationService.startRegistration(/*req.user.member.id()*/'memberId5', currentUrl, resourceName, days, moment(), function (err, statusTitle, statusText) {
    if (err) { return next(err); }
    if (statusTitle && statusText) {
      statusmessage.errorMessage(statusTitle, statusText).putIntoSession(req);
      res.redirect('/registration');
    } else {
      res.redirect('/registration/completeRegistration');
    }
  });
});

// TODO: Was wenn derjenige nicht angemeldet ist? Soll trotzdem funktionieren!
app.get('/completeRegistration', function (req, res, next) {
  subscriberstore.getSubscriber(req.user.member.id(), function (err, subscriber) {
    if (err) { return next(err); }
    res.render('participate', {member: req.user.member, addon: subscriber.addon()});
  });
});

app.post('/completeRegistration', function (req, res, next) {
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
