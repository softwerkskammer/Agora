'use strict';

const beans = require('simple-configure').get('beans');

const misc = beans.get('misc');
const validation = beans.get('validation');
const statusmessage = beans.get('statusmessage');
const mailsenderService = beans.get('mailsenderService');
const Message = beans.get('message');

function messageSubmitted(req, res, next) {
  const errors = validation.isValidMessage(req.body);
  if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }

  const message = new Message(req.body, req.user.member);

  function processResult(err, statusmsg) {
    if (err) { return next(err); }
    statusmsg.putIntoSession(req);
    res.redirect(req.body.successURL);
  }

  const activityURL = req.body.successURL.replace('/activities/', '');
  if (req.body.toParticipants) {
    message.removeAllButFirstButton();
    return mailsenderService.sendMailToParticipantsOf(activityURL, message, processResult);
  }
  if (req.body.invitedGroups) {
    return mailsenderService.sendMailToInvitedGroups(req.body.invitedGroups, activityURL, message, processResult);
  }
  if (req.body.nickname) {
    return mailsenderService.sendMailToMember(req.body.nickname, message, processResult);
  }
  statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_no_recipient').putIntoSession(req);
  res.redirect(req.body.successURL);
}

function resignmentSubmitted(req, res) {
  /* eslint handle-callback-err: 0 */
  const markdown = '**' + req.i18n.t('mailsender.why-resign') + '**\n' + req.body.why + '\n\n**' + req.i18n.t('mailsender.notes-resign') + '**\n' + req.body.notes;
  return mailsenderService.sendResignment(markdown, req.user.member, (err, statusmsg) => {
    statusmsg.putIntoSession(req);
    res.redirect('/members/' + req.user.member.nickname());
  });
}

const app = misc.expressAppIn(__dirname);

app.get('/invitation/:activityUrl', (req, res, next) => {
  mailsenderService.dataForShowingMessageForActivity(req.params.activityUrl, req.session.language, (err, result) => {
    if (err) { return next(err); }
    if (!res.locals.accessrights.canEditActivity(result.activity)) {
      return res.redirect('/activities/' + encodeURIComponent(req.params.activityUrl));
    }
    res.render('compose', result);
  });
});

app.post('/', (req, res) => {
  res.render('compose', {});
});

app.get('/contactMember/:nickname', (req, res, next) => {
  mailsenderService.dataForShowingMessageToMember(req.params.nickname, (err, result) => {
    if (err || !result) {return next(err); }
    res.render('compose', result);
  });
});

app.post('/send', messageSubmitted);

app.get('/resign/:nickname', (req, res) => {
  res.render('compose-resign', {nickname: req.params.nickname});
});

app.post('/resign', resignmentSubmitted);

module.exports = app;
