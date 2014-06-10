'use strict';

var conf = require('nconf');
var beans = conf.get('beans');
var logger = require('winston').loggers.get('transactions');
var _ = require('lodash');

var stripeService = beans.get('stripeService');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var activitystore = beans.get('activitystore');
var notifications = beans.get('notifications');
var statusmessage = beans.get('statusmessage');
var CONFLICTING_VERSIONS = beans.get('constants').CONFLICTING_VERSIONS;

var saveCreditCardPayment = function (activityUrl, memberId, callback) {
  activitystore.getActivity(activityUrl, function (err, activity) {
    if (err || !activity) { return callback(err); }
    activity.addonForMember(memberId).noteCreditCardPayment();
    activitystore.saveActivity(activity, function (err) {
      if (err && err.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        return saveCreditCardPayment(activityUrl, memberId, callback);
      }
      callback(err);
    });
  });
};

var saveMoneyTransfer = function (activityUrl, memberId, callback) {
  activitystore.getActivity(activityUrl, function (err, activity) {
    if (err || !activity) { return callback(err); }
    activity.addonForMember(memberId).noteMoneyTransfer();
    activitystore.saveActivity(activity, function (err) {
      if (err && err.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        return saveMoneyTransfer(activityUrl, memberId, callback);
      }
      callback(err);
    });
  });
};

var savePaymentReceived = function (activityUrl, memberId, callback) {
  activitystore.getActivity(activityUrl, function (err, activity) {
    if (err || !activity) { return callback(err); }
    activity.addonForMember(memberId).notePaymentReceived();
    activitystore.saveActivity(activity, function (err) {
      if (err && err.message === CONFLICTING_VERSIONS) {
        // we try again because of a racing condition during save:
        return savePaymentReceived(activityUrl, memberId, callback);
      }
      if (err) { return callback(err); }
      notifications.paymentMarked(activity, memberId);
      callback();
    });
  });
};

module.exports = {

  addonForMember: function (activityUrl, memberId, callback) {
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      return callback(null, activity.addonForMember(memberId), activity.addonConfig());
    });
  },

  saveAddon: function (activityUrl, memberId, uiInputObject, callback) {
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      activity.addonForMember(memberId).fillFromUI(uiInputObject);
      activitystore.saveActivity(activity, function (err) {
        if (err && err.message === CONFLICTING_VERSIONS) {
          // we try again because of a racing condition during save:
          return self.saveAddon(activityUrl, memberId, uiInputObject, callback);
        }
        callback(err);
      });
    });
  },

  payWithCreditCard: function (activityUrl, memberId, stripeId, callback) {
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      memberstore.getMemberForId(memberId, function (err, member) {
        if (err || !member) { return callback(err); }

        var amount = activity.addonConfig().stripeTotal();
        var charge = { amount: amount * 100, currency: 'EUR', card: stripeId,
          description: activity.title() + ' deposit for ' + member.firstname() + ' ' + member.lastname() +
            ' (' + member.nickname() + ')'};
        stripeService.transaction().charges.create(charge, function (err, charge) {
          if (err) {
            logger.error('Error on payment: ' + err.message + '. For activity: "' + activityUrl + '" and member "' + memberId + '".');
            if (err.message) {
              return callback(null, statusmessage.errorMessage('message.title.problem', 'message.content.activities.credit_card_not_paid', {reason: err.message}));
            }
            return callback(err);
          }
          logger.info('Credit Card charged for activity: "' + activityUrl + '" and member "' + memberId + '".' +
            'Charge: ' + JSON.stringify(charge));

          saveCreditCardPayment(activityUrl, memberId, function (err) {
            var displayAmount = (charge.amount / 100).toFixed(2).replace('.', ',') + ' €';
            var message = statusmessage.successMessage('message.title.save_successful', 'message.content.activities.credit_card_paid', {amount: displayAmount});
            callback(err, message);
          });
        });
      });
    });
  },

  payWithTransfer: function (activityUrl, memberId, callback) {
    saveMoneyTransfer(activityUrl, memberId, callback);
  },

  addonLinesOf: function (activityWithParticipants, callback) {
    var addonLines = _.map(activityWithParticipants.participants, function (member) {
      var addon = activityWithParticipants.addonForMember(member.id());
      return {member: member, addon: addon};
    });
    callback(null, addonLines);
  },

  submitPaymentReceived: function (activityUrl, nickname, callback) {
    memberstore.getMember(nickname, function (err, member) {
      if (err || !member) { return callback(err); }
      savePaymentReceived(activityUrl, member.id(), callback);
    });
  },

  tshirtSizes: function (addonLines) {
    var sizes = {};
    _.each(addonLines, function (line) {
      var size = line.addon.tShirtSize();
      var currentCount = sizes[size];
      if (currentCount) {
        sizes[size].count = currentCount.count + 1;
      } else {
        sizes[size] = {count: 1, size: size};
      }
    });
    return sizes;
  }


};
