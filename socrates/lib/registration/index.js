'use strict';
var moment = require('moment-timezone');

var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var mailsenderService = beans.get('mailsenderService');
var subscriberstore = beans.get('subscriberstore');

var app = misc.expressAppIn(__dirname);

app.get('/participate', function (req, res, next) {
  if (!req.user.member) {return next(); }

  subscriberstore.getSubscriber(req.user.member.id(), function (err, subscriber) {
    if (err) { return next(err); }
    var participation = {
      member: req.user.member,
      addon: subscriber.addon(),
      room: 'double',
      nights: 2
    };
    var roomOptions = [
      {id: 'single', name: 'Single', two: 214, three: 329, four: 412},
      {id: 'double', name: 'Double shared …', shareable: true, two: 174, three: 269, four: 332},
      {id: 'junior', name: 'Junior shared …', shareable: true, two: 168, three: 260, four: 320},
      {id: 'juniorAlone', name: 'Junior (exclusive)', two: 236, three: 362, four: 456}
    ];
    res.render('participate', {participation: participation, roomOptions: roomOptions});
  });
});

app.post('/participate', function (req, res) {
  console.log(req.body);
  res.redirect('participate');
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
