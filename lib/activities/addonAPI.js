"use strict";

var stripe = require('stripe');

var conf = require('nconf');
var beans = conf.get('beans');

var activitystore = beans.get('activitystore');


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
    var self = this;
    activitystore.getActivity(activityUrl, function (err, activity) {
      if (err || !activity) { return callback(err); }
      var amount = activity.addonConfig().deposit();
      var fee = activity.addonConfig().fee();
      var transaction = stripe(conf.get('secretPaymentKey'));
      var charge = { amount: (amount + fee) * 100, currency: 'EUR', card: stripeId };
      transaction.charges.create(charge, function (err, charge) {
        if (err) { return callback(err); }
        var addon = activity.addonForMember(memberId);
        addon.noteCreditCardPayment();
        self.saveAddon(activityUrl, memberId, addon.state, function (err) {
          callback(err, charge);
        });
      });
    });
  },

  payWithTransfer: function (activityUrl, memberId, callback) {
    var self = this;
    self.addonForMember(activityUrl, memberId, function (err, addon) {
      if (err) { return callback(err); }
      addon.noteMoneyTransfer();
      self.saveAddon(activityUrl, memberId, addon.state, callback);
    });
  }

};