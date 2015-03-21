'use strict';

var _ = require('lodash');
var async = require('async');

var beans = require('simple-configure').get('beans');
var membersService = beans.get('membersService');
var subscriberService = beans.get('subscriberService');
var socratesNotifications = beans.get('socratesNotifications');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var statusmessage = beans.get('statusmessage');
var validation = beans.get('validation');


function memberSubmitted(req, res, callback) {
  function notifyNewMemberRegistration(member, subscriptions) {
    // must be done here, not in Service to avoid circular deps
    return socratesNotifications.newSoCraTesMemberRegistered(member, subscriptions);
  }

  return groupsAndMembersService.updateAndSaveSubmittedMemberWithoutSubscriptions(req.user, req.body, res.locals.accessrights, notifyNewMemberRegistration, function (err, nickname) {
    if (err) { return callback(err); }
    subscriberService.createSubscriberIfNecessaryFor(req.user.member.id(), function (err) {
      if (err) { return callback(err); }
      if (nickname) {
        statusmessage.successMessage('message.title.save_successful', 'message.content.members.saved').putIntoSession(req);
      }
      return callback();
    });
  });
}


module.exports =  function (req, res, callback) {
  var body = req.body;
  async.parallel(
    [
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (nickname, callback) { membersService.isValidNickname(nickname, callback); };
        validation.checkValidity(body.previousNickname, body.nickname, validityChecker, 'validation.nickname_not_available', callback);
      },
      function (callback) {
        // we need this helper function (in order to have a closure?!)
        var validityChecker = function (email, callback) { membersService.isValidEmail(email, callback); };
        validation.checkValidity(body.previousEmail, body.email, validityChecker, 'validation.duplicate_email', callback);
      },
      function (callback) {
        return callback(null, validation.isValidForSoCraTesMember(body));
      }
    ],
    function (err, errorMessages) {
      var realErrors = _.filter(_.flatten(errorMessages), function (message) { return !!message; });
      if (realErrors.length === 0) {
        return memberSubmitted(req, res, callback);
      }
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
  );

};
