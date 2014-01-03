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
    var message = new Message(req.body, req.user.member);
    var errors = validation.isValidMessage(message);
    if (errors.length !== 0) { return res.render('../../../views/errorPages/validationError', {errors: errors}); }

    function processResult(err, type) {
      var statemessage = err ?
        statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_reason', {type: type, err: err.toString()}) :
        statusmessage.successMessage('message.title.email_successful', 'message.content.mailsender.success', {type: type});
      statemessage.putInSession(req);
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
    statusmessage.errorMessage('message.title.email_problem', 'message.content.mailsender.error_no_recipient').putInSession(req);
    res.redirect(req.body.successURL);
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

  return app;
};
