"use strict";

var conf = require('nconf');
var beans = conf.get('beans');
var logger = require('winston').loggers.get('transactions');
var _ = require('lodash');

var stripeAPI = beans.get('stripeAPI');
var membersAPI = beans.get('membersAPI');
var activitystore = beans.get('activitystore');

var saveCreditCardPayment = function (activityUrl, memberId, callback) {
  activitystore.getActivity(activityUrl, function (err, activity) {
    if (err || !activity) { return callback(err); }
    activity.addonForMember(memberId).noteCreditCardPayment();
    activitystore.saveActivity(activity, function (err) {
      if (err && err.message === "Conflicting versions.") {
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
      if (err && err.message === "Conflicting versions.") {
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
      if (err && err.message === "Conflicting versions.") {
        // we try again because of a racing condition during save:
        return savePaymentReceived(activityUrl, memberId, callback);
      }
      callback(err);
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
        if (err && err.message === "Conflicting versions.") {
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
      var amount = activity.addonConfig().deposit();
      var charge = { amount: amount * 100, currency: 'EUR', card: stripeId };
      stripeAPI.transaction().charges.create(charge, function (err, charge) {
        if (err) { return callback(err); }
        logger.info('Credit Card charged for activity: "' + activityUrl + '" and member "' + memberId + '".' +
          'Charge: ' + JSON.stringify(charge));
        saveCreditCardPayment(activityUrl, memberId, function (err) {
          callback(err, charge);
        });
      });
    });
  },

  payWithTransfer: function (activityUrl, memberId, callback) {
    saveMoneyTransfer(activityUrl, memberId, callback);
  },

  addonLinesOf: function (activityWithParticipants, callback) {
    var addonLines = _.map(activityWithParticipants.participants, function (member) {
      member.addon = activityWithParticipants.addonForMember(member.id());
      return member;
    });
    callback(null, addonLines);
  },

  submitPaymentReceived: function (activityUrl, nickname, callback) {
    membersAPI.getMember(nickname, function (err, member) {
      if (err || !member) { return callback(err); }
      savePaymentReceived(activityUrl, member.id(), callback);
    });
  }

};
