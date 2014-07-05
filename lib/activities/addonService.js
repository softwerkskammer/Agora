'use strict';

var conf = require('nconf');
var beans = conf.get('beans');
var logger = require('winston').loggers.get('transactions');
var _ = require('lodash');

var paymentService = beans.get('paymentService');
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

  payWithCreditCard: function (activityUrl, amount, memberId, stripeId, description, callback) {
    var savePayment = _.partial(saveCreditCardPayment, activityUrl, memberId);
    paymentService.payWithCreditCard(savePayment, amount, description, memberId, stripeId, callback);
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

  addonLinesOfUnsubscribedMembers: function (activityWithParticipants, callback) {
    var subscribedMemberIds = _.pluck(activityWithParticipants.participants, 'memberId');

    var unsubscribedMemberIds = _.filter(activityWithParticipants.memberIdsOfAddons(), function (memberId) {
      return subscribedMemberIds.indexOf(memberId) === -1;
    });
    callback(null, _.map(unsubscribedMemberIds, function (memberId) {
      activityWithParticipants.addonForMember(memberId);
    }));
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
