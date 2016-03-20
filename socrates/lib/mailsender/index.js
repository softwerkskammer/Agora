'use strict';

var conf = require('simple-configure');
var beans = conf.get('beans');

var misc = beans.get('misc');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var mailsenderService = beans.get('mailsenderService');
var socratesMailsenderService = beans.get('socratesMailsenderService');
var Message = beans.get('message');
var currentYear = beans.get('socratesConstants').currentYear;

var app = misc.expressAppIn(__dirname);

function messageSubmitted(req, res, next) {
  if (req.body && req.body.massMailing && !res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  var errors = validation.isValidMessage(req.body);
  if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }

  var message = new Message(req.body, req.user.member);

  function processResult(err, statusmsg) {
    if (err) { return next(err); }
    statusmsg.putIntoSession(req);
    res.redirect(req.body.successURL);
  }

  if (req.body.massMailing === 'participants') {
    return socratesMailsenderService.sendMailToParticipantsOf(currentYear, message, processResult);
  }
  if (req.body.massMailing === 'subscribers') {
    return socratesMailsenderService.sendMailToAllSubscribers(message, processResult);
  }
  if (req.body.nickname) {
    return mailsenderService.sendMailToMember(req.body.nickname, message, processResult);
  }
  statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_no_recipient').putIntoSession(req);
  res.redirect(req.body.successURL);
}

app.get('/massMailing', function (req, res) {
  var message = new Message();
  message.addToButtons({
    text: 'To SoCraTes 2016',
    url: conf.get('publicUrlPrefix')
  });
  res.render('compose', {message: message, successURL: '/', massMailing: true});
});

app.get('/contactMember/:nickname', function (req, res, next) {
  mailsenderService.dataForShowingMessageToMember(req.params.nickname, function (err, result) {
    if (err || !result) {return next(err); }
    res.render('compose', result);
  });
});

app.post('/send', function (req, res, next) {
  messageSubmitted(req, res, next);
});

module.exports = app;
