'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTestWithDB').get('beans');
var persistence = beans.get('activitiesPersistence');
var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');
var mailsenderService = beans.get('mailsenderService');
var waitinglistService = beans.get('waitinglistService');

var Activity = beans.get('activity');
var Member = beans.get('member');

var activityUrl = 'urlOfTheActivity';

var getActivity = function (url, callback) {
  persistence.getByField({url: url}, function (err, activityState) {
    callback(err, new Activity(activityState));
  });
};

describe('Waitinglist Service with DB', function () {

  var activityBeforeConcurrentAccess;
  var activityAfterConcurrentAccess;
  var invocation;

  beforeEach(function (done) { // if this fails, you need to start your mongo DB
    activityBeforeConcurrentAccess = new Activity(
      {id: 'activityId', url: activityUrl, resources: {
        'Veranstaltung': {_registeredMembers: [], _waitinglist: [
          {_memberId: 'memberIdWaiting'}
        ], _registrationOpen: true }
      }, version: 1}
    );

    activityAfterConcurrentAccess = new Activity(
      {id: 'activityId', url: activityUrl, resources: {
        'Veranstaltung': {_registeredMembers: [
          {memberId: 'memberId1'}
        ], _waitinglist: [
          {_memberId: 'memberIdWaiting'}
        ], _registrationOpen: true }
      }, version: 2}
    );

    invocation = 1;

    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      // on the first invocation, getActivity returns an activity without registrant to mimick a racing condition.
      if (invocation === 1) {
        invocation = 2;
        return callback(null, activityBeforeConcurrentAccess);
      }
      // on subsequent invocations, getActivity returns an activity with registrant.
      return callback(null, activityAfterConcurrentAccess);
    });

    sinon.stub(memberstore, 'getMember', function (nickname, callback) {
      if (nickname === 'nick') {
        return callback(null, new Member({id: 'memberIdNew'}));
      }
      if (nickname === 'waiting') {
        return callback(null, new Member({id: 'memberIdWaiting'}));
      }
      return callback(new Error('Member ' + nickname + ' not found.'));
    });

    sinon.stub(mailsenderService, 'sendRegistrationAllowed', function (member, activity, entry, callback) {
      // we don't want to send an email
      return callback(null);
    });

    persistence.drop(function () {
      // save our activity with one registrant
      activitystore.saveActivity(activityAfterConcurrentAccess, function (err) {
        done(err);
      });
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('saveWaitinglistEntry keeps the registrant that is in the database although it only reads an activity without registrant', function (done) {
    // here, we save an activity with a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first "getActivity".
    waitinglistService.saveWaitinglistEntry({nickname: 'nick', activityUrl: activityUrl, resourcename: 'Veranstaltung'}, function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err1, activity) {
        expect(activity.resourceNamed('Veranstaltung').waitinglistEntries()[0].registrantId(), 'Waiting member is still in the waitinglist').to.equal('memberIdWaiting');
        expect(activity.resourceNamed('Veranstaltung').waitinglistEntries()[1].registrantId(), 'New member is stored in the waitinglist').to.equal('memberIdNew');
        expect(activity.resourceNamed('Veranstaltung').registeredMembers(), 'First registered member is still there').to.contain('memberId1');
        done(err1);
      });
    });
  });

  it('allowRegistrationForWaitinglistEntry keeps the registrant that is in the database although it only reads an activity without registrant', function (done) {
    // here, we save an activity after removing a member that is different from the member in the database.
    // To mimick a racing condition, we return an activity without members for the first 'getActivity'.
    waitinglistService.allowRegistrationForWaitinglistEntry({nickname: 'waiting', activityUrl: activityUrl, resourcename: 'Veranstaltung', hoursstring: '10'}, function (err) {
      if (err) { return done(err); }
      getActivity(activityUrl, function (err1, activity) {
        expect(activity.resourceNamed('Veranstaltung').waitinglistEntries()[0].canSubscribe(), 'Waiting member is now allowed to subscribe').to.be(true);
        expect(activity.resourceNamed('Veranstaltung').registeredMembers(), 'First registered member is still there').to.contain('memberId1');
        done(err1);
      });
    });
  });

});
