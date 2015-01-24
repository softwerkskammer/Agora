'use strict';

var _ = require('lodash');
var async = require('async');

var beans = require('simple-configure').get('beans');
var misc = beans.get('misc');
var membersService = beans.get('membersService');
var subscriberService = beans.get('subscriberService');
var Member = beans.get('member');
var socratesNotifications = beans.get('socratesNotifications');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var statusmessage = beans.get('statusmessage');
var validation = beans.get('validation');

var app = misc.expressAppIn(__dirname);

app.get('/checknickname', function (req, res) {
  misc.validate(req.query.nickname, req.query.previousNickname, membersService.isValidNickname, res.end);
});

app.get('/checkemail', function (req, res) {
  misc.validate(req.query.email, req.query.previousEmail, membersService.isValidEmail, res.end);
});

app.get('/edit', function (req, res) {
  var member = req.user.member || new Member().initFromSessionUser(req.user, true);
  res.render('edit', {member: member});
});

app.post('/submit', function (req, res, next) {
  function memberSubmitted(req, res, next) {
    function notifyNewMemberRegistration(member, subscriptions) {
      // must be done here, not in Service to avoid circular deps
      return socratesNotifications.newSoCraTesMemberRegistered(member, subscriptions);
    }

    return groupsAndMembersService.updateAndSaveSubmittedMemberWithoutSubscriptions(req.user, req.body, res.locals.accessrights, notifyNewMemberRegistration, function (err, nickname) {
      if (err) { return next(err); }
      subscriberService.createSubscriberIfNecessaryFor(req.user.member.id(), function (err) {
        if (err) { return next(err); }
        if (nickname) {
          statusmessage.successMessage('message.title.save_successful', 'message.content.members.saved').putIntoSession(req);
        }
        return res.redirect('/');
      });
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


app.get('/:nickname', function (req, res, next) {
  subscriberService.getMemberIfSubscriberExists(req.params.nickname, function (err, member) {
    if (err || !member) { return next(err); }
    res.render('get', {member: member});
  });
});

module.exports = app;
