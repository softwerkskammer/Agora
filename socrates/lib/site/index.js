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
  return eventstoreService.getRegistrationReadModel(socratesConstants.currentUrl, (err, registrationReadModel) => {
    if (err || !registrationReadModel) {
      return next(err);
    } else {
      return eventstoreService.getRoomsReadModel(socratesConstants.currentUrl, (err2, roomsReadModel) => {
        if (err2 || !roomsReadModel) {
          return next(err2);
        } else {
          const memberId = res.locals.accessrights.memberId();
          const registration = {
            alreadyRegistered: registrationReadModel.isAlreadyRegistered(memberId),
            alreadyOnWaitinglist: registrationReadModel.isAlreadyOnWaitinglist(memberId),
            selectedOptions: registrationReadModel.selectedOptionsFor(memberId),
            roommate: roomsReadModel.roommateFor('bed_in_double', memberId) || roomsReadModel.roommateFor('bed_in_junior', memberId)
          };

          return res.render('index', {sponsors: sponsorpairs(), registration});
        }
      });
    }
  });
});

app.get('/goodbye.html', (req, res) => {
  if (req.user && req.user.member) {
    return res.redirect('/');
  } else {
    return res.render('goodbye');
  }
});

app.get('/robots.txt', (req, res, next) => {
  return fs.readFile(path.join(__dirname, 'views', 'robots.txt'), 'utf8', (err, data) => {
    if (!err) {
      return res.send(data);
    } else {
      return next(err);
    }
  });
});

app.get('/impressum.html', (req, res) => {
  return res.render('impressum');
});

app.get('/schedule.html', (req, res) => {
  return res.render('schedule', {currentYear: socratesConstants.currentYear});
});

app.get('/experienceReports.html', (req, res) => {
  return res.render('experienceReports');
});

app.get('/location.html', (req, res) => {
  return res.render('location');
});

app.get('/history.html', (req, res) => {
  return res.render('history');
});

app.get('/values.html', (req, res) => {
  return res.render('values');
});

app.get('/sponsoring.html', (req, res) => {
  return res.render('sponsoring');
});

app.post('/preview', (req, res) => {
  return res.send(Renderer.render(req.body.data, req.body.subdir));
});

app.get('/login', (req, res) => {
  return res.render('authenticationRequired');
});

app.get('/loginDialog', (req, res) => {
  return res.render('loginDialog', {returnUrl: req.query.returnUrl});
});

app.get('/cheatsheet.html', (req, res) => {
  return res.render('lazyMarkdownCheatsheet');
});

app.get('/mustBeSuperuser', (req, res) => {
  return res.render('superuserRightsRequired', {requestedPage: req.query.page});
});

app.get('/mustBeSoCraTesAdmin', (req, res) => {
  return res.render('socratesAdminRightsRequired', {requestedPage: req.query.page});
});

app.get('/qrcode', (req, res) => {
  const url = req.query.url;
  const fullUrl = misc.startsWith(url, 'http') ? url : conf.get('publicUrlPrefix') + url;
  const img = qrimage.image(fullUrl, {type: 'svg'});
  res.type('svg');
  return img.pipe(res);
});

app.get('/resign', (req, res) => {
  if (req.user.member) {
    return res.render('compose-resign', {nickname: req.user.member.nickname()});
  } else {
    return res.render('/');
  }
});

app.post('/submitresign', (req, res, next) => {
  const markdown = '#### Resignation from SoCraTes-Conference\n\n' + '**' + req.i18n.t('mailsender.why-resign') + '**\n' + req.body.why + '\n\n**' + req.i18n.t('mailsender.notes-resign') + '**\n' + req.body.notes;
  return mailsenderService.sendResignment(markdown, req.user.member, (err, statusmsg) => {
    if (!err) {
      statusmsg.putIntoSession(req);
      return res.redirect('/');
    } else {
      return next(err);
    }
  });
});

module.exports = app;
