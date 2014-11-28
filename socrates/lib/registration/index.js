'use strict';
var moment = require('moment-timezone');
var async = require('async');
var _ = require('lodash');

var beans = require('nconf').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var notifications = beans.get('notifications');
var validation = beans.get('validation');
var statusmessage = beans.get('statusmessage');
var Member = beans.get('member');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var mailsenderService = beans.get('mailsenderService');

var app = misc.expressAppIn(__dirname);

app.get('/participate', function (req, res) {
  var participation = {
    member: req.user.member,
    user: {
      privateaddress: 'Morgenstr. 41\n76131 Karlsruhe\nDeutschland',
      billingaddress: 'Same',
      tshirtsize: 'L'
    },
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

app.post('/participate', function (req, res) {
  console.log(req.body);
  res.redirect('participate');
});

app.get('/editmember', function (req, res) {
  var member = req.user.member || new Member().initFromSessionUser(req.user, true);
  res.render('editmember', {member: member});
});

app.post('/submitmember', function (req, res, next) {
  function memberSubmitted(req, res, next) {
    function notifyNewMemberRegistration(member, subscriptions) {
      // must be done here, not in Service to avoid circular deps
      return notifications.newMemberRegistered(member, subscriptions);
    }

    return groupsAndMembersService.updateAndSaveSubmittedMemberWithoutSubscriptions(req.user, req.body, res.locals.accessrights, notifyNewMemberRegistration, function (err, nickname) {
      if (err) { return next(err); }
      if (nickname) {
        statusmessage.successMessage('message.title.save_successful', 'message.content.members.saved').putIntoSession(req);
        return res.redirect('/');
      }
      return res.redirect('/');
    });
  }

  async.parallel(
    [
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (nickname, callback) { membersService.isValidNickname(nickname, callback); };
        validation.checkValidity(req.body.previousNickname, req.body.nickname, validityChecker, 'validation.nickname_not_available', callback);
      },
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (email, callback) { membersService.isValidEmail(email, callback); };
        validation.checkValidity(req.body.previousEmail, req.body.email, validityChecker, 'validation.duplicate_email', callback);
      },
      function (callback) {
        return callback(null, validation.isValidForSoCraTesMember(req.body));
      }
    ],
    function (err, errorMessages) {
      var realErrors = _.filter(_.flatten(errorMessages), function (message) { return !!message; });
      if (realErrors.length === 0) {
        return memberSubmitted(req, res, next);
      }
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
  );

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
