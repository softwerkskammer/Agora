/*eslint no-underscore-dangle: 0*/
'use strict';

var path = require('path');
var fs = require('fs');
var qrimage = require('qr-image');
var _ = require('lodash');

var conf = require('simple-configure');
var beans = conf.get('beans');
var Renderer = beans.get('renderer');
var misc = beans.get('misc');
var mailsenderService = beans.get('mailsenderService');
var socratesConstants = beans.get('socratesConstants');
var sponsorpairs = require('./sponsorpairs');

var app = misc.expressAppIn(__dirname);

app.get('/', function (req, res) {
  res.render('index', {sponsors: sponsorpairs()});
});

app.get('/goodbye.html', function (req, res) {
  if (req.user && req.user.member) {
    return res.redirect('/');
  }
  res.render('goodbye');
});

app.get('/robots.txt', function (req, res, next) {
  fs.readFile(path.join(__dirname, 'views', 'robots.txt'), 'utf8', function (err, data) {
    if (err) { return next(err); }
    res.send(data);
  });
});

app.get('/impressum.html', function (req, res) {
  res.render('impressum');
});

app.get('/schedule.html', function (req, res) {
  res.render('schedule', {currentYear: socratesConstants.currentYear});
});

app.get('/experienceReports.html', function (req, res) {
  res.render('experienceReports');
});

app.get('/location.html', function (req, res) {
  res.render('location');
});

app.get('/history.html', function (req, res) {
  res.render('history');
});

app.get('/values.html', function (req, res) {
  res.render('values');
});

app.get('/sponsoring.html', function (req, res) {
  res.render('sponsoring');
});

app.post('/preview', function (req, res) {
  res.send(Renderer.render(req.body.data, req.body.subdir));
});

app.get('/login', function (req, res) {
  res.render('authenticationRequired');
});

app.get('/loginDialog', function (req, res) {
  res.render('loginDialog', {returnUrl: req.query.returnUrl});
});

app.get('/cheatsheet.html', function (req, res) {
  res.render('lazyMarkdownCheatsheet');
});

app.get('/mustBeSuperuser', function (req, res) {
  res.render('superuserRightsRequired', {requestedPage: req.query.page});
});

app.get('/mustBeSoCraTesAdmin', function (req, res) {
  res.render('socratesAdminRightsRequired', {requestedPage: req.query.page});
});

app.get('/qrcode', function (req, res) {
  var url = req.query.url;
  var fullUrl = _.startsWith(url, 'http') ? url : conf.get('publicUrlPrefix') + url;
  var img = qrimage.image(fullUrl, {type: 'svg'});
  res.type('svg');
  img.pipe(res);
});

app.get('/resign', function (req, res) {
  if (req.user.member) {
    return res.render('compose-resign', {nickname: req.user.member.nickname()});
  }
  return res.render('/');
});

app.post('/submitresign', function (req, res, next) {
  var markdown = '#### Resignation from SoCraTes-Conference\n\n' + '**' + req.i18n.t('mailsender.why-resign') + '**\n' + req.body.why + '\n\n**' + req.i18n.t('mailsender.notes-resign') + '**\n' + req.body.notes;
  return mailsenderService.sendResignment(markdown, req.user.member, function (err, statusmsg) {
    if (err) { return next(err); }
    statusmsg.putIntoSession(req);
    res.redirect('/');
  });
});

module.exports = app;
