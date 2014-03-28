"use strict";

var nconf = require('../../testutil/configureForTestWithDB');
var moment = require('moment-timezone');
var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();

var beans = nconf.get('beans');
var persistence = beans.get('activitiesPersistence');
var activitystore = beans.get('activitystore');
var addonAPI = beans.get('addonAPI');
var stripeAPI = beans.get('stripeAPI');
var notifications = beans.get('notifications');

var Activity = beans.get('activity');

var activityUrl = 'urlOfTheActivity';


var getActivity = function (url, callback) {
  persistence.getByField({url: url}, function (err, activityState) {
    callback(err, new Activity(activityState));
  });
};

describe('Addon API', function () {

  var activityBeforeConcurrentAccess;
  var activityAfterConcurrentAccess;
  var invocation;

  beforeEach(function (done) { // if this fails, you need to start your mongo DB
    activityBeforeConcurrentAccess = new Activity({id: "activityId",
                                                    url: activityUrl, _addons: {}, version: 1});

    activityAfterConcurrentAccess = new Activity({id: "activityId",
                                                   url: activityUrl, _addons: { memberIdRace: {homeAddress: "At Home"}}, version: 2});

    invocation = 1;

    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      // on the first invocation, getActivity returns an activity without addon information to mimick a racing condition.
      if (invocation === 1) {
        invocation = 2;
        return callback(null, activityBeforeConcurrentAccess);
      }
      // on subsequent invocations, getActivity returns an activity with addon information.
      return callback(null, activityAfterConcurrentAccess);
    });

    sinon.stub(stripeAPI, 'transaction', function () {
      return { charges: { create: function (charge, callback) { callback(null, {}); } } };
    });

    persistence.drop(function () {
      // empty the store and then save our activity with one registrant
      activitystore.saveActivity(activityAfterConcurrentAccess, function (err) {
        done(err);
      });
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('saveAddon keeps the member addon info that is in the database although it only reads an activity without member addon info', function (done) {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    addonAPI.saveAddon(activityUrl, 'memberIdNew', {roommate: 'A nice guy'}, function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err, activity) {
        if (err) { return done(err); }
        expect(activity.addonForMember('memberIdRace').homeAddress(), 'Previous member is still in the waitinglist').to.equal('At Home');
        expect(activity.addonForMember('memberIdNew').roommate(), 'Second member is stored in the waitinglist').to.equal('A nice guy');
        done(err);
      });
    });
  });


  it('payWithCreditCard keeps the member addon info that is in the database although it only reads an activity without member addon info', function (done) {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    addonAPI.payWithCreditCard(activityUrl, 'memberIdNew', 'stripe-id', function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err, activity) {
        if (err) { return done(err); }
        expect(activity.addonForMember('memberIdRace').homeAddress(), 'Previous member is still in the waitinglist').to.equal('At Home');
        expect(activity.addonForMember('memberIdNew').creditCardPaid(), 'Second member is stored in the waitinglist').to.not.be.undefined;
        done(err);
      });
    });
  });


  it('payWithTransfer keeps the member addon info that is in the database although it only reads an activity without member addon info', function (done) {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    addonAPI.payWithTransfer(activityUrl, 'memberIdNew', function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err, activity) {
        if (err) { return done(err); }
        expect(activity.addonForMember('memberIdRace').homeAddress(), 'Previous member is still in the waitinglist').to.equal('At Home');
        expect(activity.addonForMember('memberIdNew').moneyTransferred(), 'Second member is stored in the waitinglist').to.not.be.undefined;
        done(err);
      });
    });
  });

});
