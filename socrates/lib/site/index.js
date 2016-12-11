/*eslint no-underscore-dangle: 0*/
'use strict';

const path = require('path');
const fs = require('fs');
const qrimage = require('qr-image');

const conf = require('simple-configure');
const beans = conf.get('beans');
const Renderer = beans.get('renderer');
const misc = beans.get('misc');
const eventstoreService = beans.get('eventstoreService');
const mailsenderService = beans.get('mailsenderService');
const socratesConstants = beans.get('socratesConstants');
const sponsorpairs = require('./sponsorpairs');

const app = misc.expressAppIn(__dirname);

app.get('/', (req, res, next) => {
  eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, (err, registrationReadModel) => {
    if (err || !registrationReadModel) { return next(err); }
    eventstoreService.getRoomsReadModel(socratesConstants.currentUrl, (err2, roomsReadModel) => {
      if (err2 || !roomsReadModel) { return next(err2); }
      const memberId = res.locals.accessrights.memberId();
      const registration = {
        alreadyRegistered: registrationReadModel.isAlreadyRegistered(memberId),
        alreadyOnWaitinglist: registrationReadModel.isAlreadyOnWaitinglist(memberId),
        selectedOptions: registrationReadModel.selectedOptionsFor(memberId),
        roommate: roomsReadModel.roommateFor('bed_in_double', memberId) || roomsReadModel.roommateFor('bed_in_junior', memberId)
      };

      res.render('index', {sponsors: sponsorpairs(), registration: registration});
    });
  });
});

app.get('/goodbye.html', (req, res) => {
  if (req.user && req.user.member) {
    return res.redirect('/');
  }
  res.render('goodbye');
});

app.get('/robots.txt', (req, res, next) => {
  fs.readFile(path.join(__dirname, 'views', 'robots.txt'), 'utf8', (err, data) => {
    if (err) { return next(err); }
    res.send(data);
  });
});

app.get('/impressum.html', (req, res) => {
  res.render('impressum');
});

app.get('/schedule.html', (req, res) => {
  res.render('schedule', {currentYear: socratesConstants.currentYear});
});

app.get('/experienceReports.html', (req, res) => {
  res.render('experienceReports');
});

app.get('/location.html', (req, res) => {
  res.render('location');
});

app.get('/history.html', (req, res) => {
  res.render('history');
});

app.get('/values.html', (req, res) => {
  res.render('values');
});

app.get('/sponsoring.html', (req, res) => {
  res.render('sponsoring');
});

app.post('/preview', (req, res) => {
  res.send(Renderer.render(req.body.data, req.body.subdir));
});

app.get('/login', (req, res) => {
  res.render('authenticationRequired');
});

app.get('/loginDialog', (req, res) => {
  res.render('loginDialog', {returnUrl: req.query.returnUrl});
});

app.get('/cheatsheet.html', (req, res) => {
  res.render('lazyMarkdownCheatsheet');
});

app.get('/mustBeSuperuser', (req, res) => {
  res.render('superuserRightsRequired', {requestedPage: req.query.page});
});

app.get('/mustBeSoCraTesAdmin', (req, res) => {
  res.render('socratesAdminRightsRequired', {requestedPage: req.query.page});
});

app.get('/qrcode', (req, res) => {
  const url = req.query.url;
  const fullUrl = misc.startsWith(url, 'http') ? url : conf.get('publicUrlPrefix') + url;
  const img = qrimage.image(fullUrl, {type: 'svg'});
  res.type('svg');
  img.pipe(res);
});

app.get('/resign', (req, res) => {
  if (req.user.member) {
    return res.render('compose-resign', {nickname: req.user.member.nickname()});
  }
  return res.render('/');
});

app.post('/submitresign', (req, res, next) => {
  const markdown = '#### Resignation from SoCraTes-Conference\n\n' + '**' + req.i18n.t('mailsender.why-resign') + '**\n' + req.body.why + '\n\n**' + req.i18n.t('mailsender.notes-resign') + '**\n' + req.body.notes;
  return mailsenderService.sendResignment(markdown, req.user.member, (err, statusmsg) => {
    if (err) { return next(err); }
    statusmsg.putIntoSession(req);
    res.redirect('/');
  });
});

module.exports = app;
