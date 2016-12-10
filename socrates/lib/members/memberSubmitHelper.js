'use strict';

const R = require('ramda');
const async = require('async');

const beans = require('simple-configure').get('beans');
const misc = beans.get('misc');
const membersService = beans.get('membersService');
const subscriberService = beans.get('subscriberService');
const socratesNotifications = beans.get('socratesNotifications');
const groupsAndMembersService = beans.get('groupsAndMembersService');
const statusmessage = beans.get('statusmessage');
const validation = beans.get('validation');

function memberSubmitted(req, res, callback) {
  function notifyNewMemberRegistration(member, subscriptions) {
    // must be done here, not in Service to avoid circular deps
    return socratesNotifications.newSoCraTesMemberRegistered(member, subscriptions);
  }

  return groupsAndMembersService.updateAndSaveSubmittedMemberWithoutSubscriptions(req.user, req.body, res.locals.accessrights, notifyNewMemberRegistration, (err, nickname) => {
    if (err) { return callback(err); }
    subscriberService.createSubscriberIfNecessaryFor(req.user.member.id(), err1 => {
      if (err1) { return callback(err1); }
      if (nickname) {
        statusmessage.successMessage('message.title.save_successful', 'message.content.members.saved').putIntoSession(req);
      }
      return callback();
    });
  });
}

module.exports = function (req, res, next, globalCallback) {
  const body = req.body;
  async.parallel(
    [
      callback => {
        validation.checkValidity(body.previousNickname, body.nickname, membersService.isValidNickname, 'validation.nickname_not_available', callback);
      },
      callback => {
        validation.checkValidity(body.previousEmail, body.email, membersService.isValidEmail, 'validation.duplicate_email', callback);
      },
      callback => callback(null, validation.isValidForSoCraTesMember(body))
    ],
    (err, errorMessages) => {
      if (err) { return next(err); }
      const realErrors = misc.compact(R.flatten(errorMessages));
      if (realErrors.length === 0) {
        return memberSubmitted(req, res, globalCallback);
      }
      return res.render('../../../views/errorPages/validationError', {errors: realErrors});
    }
  );

};
