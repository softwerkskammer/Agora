'use strict';

const conf = require('simple-configure');
const beans = conf.get('beans');

const misc = beans.get('misc');
const validation = beans.get('validation');
const statusmessage = beans.get('statusmessage');
const mailsenderService = beans.get('mailsenderService');
const socratesMailsenderService = beans.get('socratesMailsenderService');
const Message = beans.get('message');
const currentYear = beans.get('socratesConstants').currentYear;

const app = misc.expressAppIn(__dirname);

function messageSubmitted(req, res, next) {
  if (req.body && req.body.massMailing && !res.locals.accessrights.canEditActivity()) {
    return res.redirect('/registration');
  }

  const errors = validation.isValidMessage(req.body);
  if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }

  const message = new Message(req.body, req.user.member);

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

app.get('/massMailing', (req, res) => {
  const message = new Message();
  message.addToButtons({
    text: 'To SoCraTes 2017',
    url: conf.get('publicUrlPrefix')
  });
  res.render('compose', {message: message, successURL: '/', massMailing: true});
});

app.get('/contactMember/:nickname', (req, res, next) => {
  mailsenderService.dataForShowingMessageToMember(req.params.nickname, (err, result) => {
    if (err || !result) {return next(err); }
    res.render('compose', result);
  });
});

app.post('/send', messageSubmitted);

module.exports = app;
