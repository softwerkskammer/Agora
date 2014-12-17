'use strict';

var expect = require('must');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTestWithDB').get('beans');
var persistence = beans.get('activitiesPersistence');
var activitystore = beans.get('activitystore');
var addonService = beans.get('addonService');
var stripeService = beans.get('stripeService');
var memberstore = beans.get('memberstore');

var Activity = beans.get('activity');
var Member = beans.get('member');

var activityUrl = 'urlOfTheActivity';

var getActivity = function (url, callback) {
  persistence.getByField({url: url}, function (err, activityState) {
    callback(err, new Activity(activityState));
  });
};

describe('Addon Service with DB', function () {

  var activityBeforeConcurrentAccess;
  var activityAfterConcurrentAccess;
  var invocation;
  var chargedCreditCard;

  beforeEach(function (done) { // if this fails, you need to start your mongo DB
    activityBeforeConcurrentAccess = new Activity({id: 'activityId',
      url: activityUrl, _addons: {}, version: 1});

    activityAfterConcurrentAccess = new Activity({id: 'activityId',
      url: activityUrl, _addons: { memberIdRace: {homeAddress: 'At Home'}}, version: 2});

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

    chargedCreditCard = 0;
    sinon.stub(stripeService, 'transaction', function () {
      return { charges: { create: function (charge, callback) {
        chargedCreditCard = chargedCreditCard + 1;
        callback(null, {});
      } } };
    });
    sinon.stub(memberstore, 'getMemberForId', function (id, callback) { callback(null, new Member({firstname: 'Hans', lastname: 'Dampf', nickname: 'hada'})); });
    sinon.stub(memberstore, 'getMember', function (nick, callback) { callback(null, new Member({id: 'memberIdNew', firstname: 'Hans', lastname: 'Dampf', nickname: 'hada'})); });

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
    addonService.saveAddon(activityUrl, 'memberIdNew', {roommate: 'A nice guy'}, function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err, activity) {
        if (err) { return done(err); }
        expect(activity.addonForMember('memberIdRace').homeAddress(), 'Previous member has still her addon').to.equal('At Home');
        expect(activity.addonForMember('memberIdNew').roommate(), 'Second member has her addon').to.equal('A nice guy');
        done(err);
      });
    });
  });

  it('payWithCreditCard keeps the member addon info that is in the database although it only reads an activity without member addon info', function (done) {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    addonService.payWithCreditCard(activityUrl, 20, 'memberIdNew', 'stripe-id', '', function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err, activity) {
        if (err) { return done(err); }
        expect(activity.addonForMember('memberIdRace').homeAddress(), 'Previous member has still her addon').to.equal('At Home');
        expect(activity.addonForMember('memberIdNew').creditCardPaid(), 'Second member has her addon').to.not.be(undefined);
        expect(chargedCreditCard, 'We withdrew money only once despite the racing condition').to.equal(1);
        done(err);
      });
    });
  });

  it('payWithTransfer keeps the member addon info that is in the database although it only reads an activity without member addon info', function (done) {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    addonService.payWithTransfer(activityUrl, 'memberIdNew', function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err, activity) {
        if (err) { return done(err); }
        expect(activity.addonForMember('memberIdRace').homeAddress(), 'Previous member has still her addon').to.equal('At Home');
        expect(activity.addonForMember('memberIdNew').moneyTransferred(), 'Second member has her addon').to.not.be(undefined);
        done(err);
      });
    });
  });

  it('submitPaymentReceived keeps the member addon info that is in the database although it only reads an activity without member addon info', function (done) {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    addonService.submitPaymentReceived(activityUrl, 'newNick', function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err, activity) {
        if (err) { return done(err); }
        expect(activity.addonForMember('memberIdRace').homeAddress(), 'Previous member has still her addon').to.equal('At Home');
        expect(activity.addonForMember('memberIdNew').paymentReceivedMoment(), 'Second member has her addon').to.not.be(undefined);
        done(err);
      });
    });
  });

});
