"use strict";

var path = require('path');
var conf = require('nconf');

module.exports = function (app) {
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'jade');

  var beans = conf.get('beans');

  var validation = beans.get('validation');
  var statusmessage = beans.get('statusmessage');
  var mailsenderAPI = beans.get('mailsenderAPI');
  var Message = beans.get('message');

  function messageSubmitted(req, res) {
    var errors = validation.isValidMessage(req.body);
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }

    var message = new Message(req.body, req.user.member);

    function processResult(statusmsg) {
      statusmsg.putIntoSession(req);
      res.redirect(req.body.successURL);
    }

    if (req.body.toParticipants) {
      return mailsenderAPI.sendMailToParticipantsOf(req.body.successURL.replace('/activities/', ''), message, processResult);
    }
    if (req.body.invitedGroups) {
      return mailsenderAPI.sendMailToInvitedGroups(req.body.invitedGroups, message, processResult);
    }
    if (req.body.nickname) {
      return mailsenderAPI.sendMailToMember(req.body.nickname, message, processResult);
    }
    statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_no_recipient').putIntoSession(req);
    res.redirect(req.body.successURL);
  }

  function resignmentSubmitted(req, res) {
    var markdown = '**' + req.i18n.t("mailsender.why-resign") + '**\n' + req.body.why + '\n\n**' + req.i18n.t("mailsender.notes-resign") + '**\n' + req.body.notes;
    return mailsenderAPI.sendResignment(markdown, req.user.member, function (statusmsg) {
      statusmsg.putIntoSession(req);
      res.redirect('/members/' + req.user.member.nickname());
    });
  }

  app.get('/invitation/:activityUrl', function (req, res, next) {
    mailsenderAPI.dataForShowingMessageForActivity(req.params.activityUrl, req.session.language, function (err, result) {
      if (err) { return next(err); }
      if (!res.locals.accessrights.canEditActivity(result.activity)) {
        return res.redirect('/activities/' + encodeURIComponent(req.params.activityUrl));
      }
      res.render('compose', result);
    });
  });

  app.post('/', function (req, res) {
    res.render('compose', {});
  });

  app.get('/contactMember/:nickname', function (req, res, next) {
    mailsenderAPI.dataForShowingMessageToMember(req.params.nickname, function (err, result) {
      if (err || !result) {return next(err); }
      res.render('compose', result);
    });
  });

  app.post('/send', function (req, res, next) {
    messageSubmitted(req, res, next);
  });

  app.get('/resign/:nickname', function (req, res) {
    res.render('compose-resign', {nickname: req.params.nickname});
  });

  app.post('/resign', function (req, res, next) {
    resignmentSubmitted(req, res, next);
  });

  return app;
};
