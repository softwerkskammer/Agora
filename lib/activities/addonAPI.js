"use strict";

var conf = require('nconf');
var beans = conf.get('beans');
var logger = require('winston').loggers.get('transactions');

var stripeAPI = beans.get('stripeAPI');
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
      var fee = activity.addonConfig().fee();
      var charge = { amount: (amount + fee) * 100, currency: 'EUR', card: stripeId };
      stripeAPI.transaction().charges.create(charge, function (err, charge) {
        if (err) { return callback(err); }
        // log the created charge!
        logger.info('Credit Card payment saved for activity: "' + activityUrl + '" and member "' + memberId + '".' +
          'Charge: ' + JSON.stringify(charge) + '. State: ' + (err ? 'ERROR' : 'OK'));
        saveCreditCardPayment(activityUrl, memberId, function (err) {
          callback(err, charge);
        });
      });
    });
  },

  payWithTransfer: function (activityUrl, memberId, callback) {
    saveMoneyTransfer(activityUrl, memberId, callback);
  }

};
