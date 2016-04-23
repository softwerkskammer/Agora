'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');
var moment = require('moment-timezone');
var _ = require('lodash');

//var util = require('util');

var beans = require('../../testutil/configureForTest').get('beans');
var waitinglistService = beans.get('waitinglistService');

var activitystore = beans.get('activitystore');
var memberstore = beans.get('memberstore');
var mailsenderService = beans.get('mailsenderService');
var Member = beans.get('member');
var Activity = beans.get('activity');

var activity1;

var waitinglistMembersOf = function (activity, resourceName) {
  return _.map(_.map(activity.resourceNamed(resourceName).waitinglistEntries(), 'state'), '_memberId');
};

var activityWithEinzelzimmer = function (resource) {
  var state = {url: 'activity-url', resources: {Einzelzimmer: resource }};
  var activity = new Activity(state);
  sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, activity); });
  return activity;
};

describe('Waitinglist Service', function () {

  afterEach(function () {
    sinon.restore();
  });

  describe('- waitinglist - ', function () {

    beforeEach(function () {
      var member1 = new Member({id: '12345', nickname: 'hansdampf'});
      var member2 = new Member({id: 'abcxyz', nickname: 'nickinick'});
      activity1 = new Activity({id: 'Meine Aktivität', url: 'myActivity', resources: {'Meine Ressource': {_waitinglist: []}}});

      sinon.stub(memberstore, 'getMemberForId', function (memberId, callback) {
        if (memberId === member1.id()) { return callback(null, member1); }
        if (memberId === member2.id()) { return callback(null, member2); }
      });
      sinon.stub(activitystore, 'getActivity', function (activity, callback) {
        return callback(null, activity1);
      });
    });

    it('returns an empty list when the waitinglist is empty', function (done) {
      waitinglistService.waitinglistFor('myActivity', function (err, waitinglist) {
        expect(waitinglist).to.be.empty();
        done(err);
      });
    });

    it('returns one entry with its member nickname when the waitinglist contains one entry', function (done) {
      activity1.resourceNamed('Meine Ressource').addToWaitinglist('12345', moment());

      waitinglistService.waitinglistFor('myActivity', function (err, waitinglist) {
        expect(waitinglist.length).to.equal(1);
        expect(waitinglist[0].registrantNickname).to.equal('hansdampf');
        expect(waitinglist[0].resourceName()).to.equal('Meine Ressource');
        expect(waitinglist[0].registrationDate()).to.not.be(undefined);
        expect(waitinglist[0].registrationValidUntil()).to.be(undefined);
        done(err);
      });
    });

    it('returns two entries with their member nicknames when the waitinglist contains two entries', function (done) {
      activity1.resourceNamed('Meine Ressource').addToWaitinglist('12345', moment());
      activity1.resourceNamed('Meine Ressource').addToWaitinglist('abcxyz', moment());

      waitinglistService.waitinglistFor('myActivity', function (err, waitinglist) {
        expect(waitinglist.length).to.equal(2);
        expect(waitinglist[0].registrantNickname).to.equal('hansdampf');
        expect(waitinglist[1].registrantNickname).to.equal('nickinick');
        done(err);
      });
    });
  });

  describe('- when saving a waitinglist entry -', function () {

    beforeEach(function () { return undefined; });

    it('succeeds no matter whether registration is open or not', function (done) {
      activityWithEinzelzimmer({_waitinglist: [
        {_memberId: 'otherId'}
      ]});
      var savedActivity;
      sinon.stub(activitystore, 'saveActivity', function (activityToSave, callback) {
        savedActivity = activityToSave;
        callback(null);
      });
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, new Member({id: 'memberId', nickname: 'hansdampf'})); });

      var args = {nickname: 'memberId', activityUrl: 'activity-url', resourcename: 'Einzelzimmer'};
      waitinglistService.saveWaitinglistEntry(args, function (err) {
        var waitinglistMembers = waitinglistMembersOf(savedActivity, 'Einzelzimmer');
        expect(waitinglistMembers).to.contain('memberId');
        expect(waitinglistMembers).to.contain('otherId');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, new Member({id: 'memberId', nickname: 'hansdampf'})); });

      var args = {nickname: 'memberId', activityUrl: 'activity-url', resourcename: 'Einzelzimmer'};
      waitinglistService.saveWaitinglistEntry(args, function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });

    it('gives an error when member could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, new Activity()); });
      sinon.stub(memberstore, 'getMember', function (id, callback) { callback(new Error('error')); });

      var args = {nickname: 'memberId', activityUrl: 'activity-url', resourcename: 'Einzelzimmer'};
      waitinglistService.saveWaitinglistEntry(args, function (err) {
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

  describe('- when allowing registration for a waitinglist entry -', function () {

    var mailNotification;

    beforeEach(function () {
      mailNotification = undefined;
      sinon.stub(mailsenderService, 'sendRegistrationAllowed', function (member, activity, entry, callback) {
        mailNotification = {member: member, activity: activity, entry: entry};
        callback(null);
      });
    });

    it('succeeds no matter whether registration is open or not', function (done) {
      activityWithEinzelzimmer({_waitinglist: [
        {_memberId: 'memberId'},
        {_memberId: 'otherId'}
      ]});
      var savedActivity;
      sinon.stub(activitystore, 'saveActivity', function (activityToSave, callback) {
        savedActivity = activityToSave;
        callback(null);
      });
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, new Member({id: 'memberId', nickname: 'hansdampf'})); });

      var args = {nickname: 'memberId', activityUrl: 'activity-url', resourcename: 'Einzelzimmer'};
      waitinglistService.allowRegistrationForWaitinglistEntry(args, function (err) {
        var waitinglistMembers = waitinglistMembersOf(savedActivity, 'Einzelzimmer');
        expect(waitinglistMembers).to.contain('memberId');
        expect(waitinglistMembers).to.contain('otherId');

        expect(mailNotification.member.id()).to.equal('memberId');
        expect(mailNotification.activity.url()).to.equal('activity-url');
        expect(mailNotification.entry.registrantId()).to.equal('memberId');
        done(err);
      });
    });

    it('gives an error and does not notify when save failed', function (done) {
      activityWithEinzelzimmer({_waitinglist: [
        {_memberId: 'memberId'},
        {_memberId: 'otherId'}
      ]});
      sinon.stub(activitystore, 'saveActivity', function (activityToSave, callback) {
        callback(new Error('Some problem during save'));
      });
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, new Member({id: 'memberId', nickname: 'hansdampf'})); });

      var args = {nickname: 'memberId', activityUrl: 'activity-url', resourcename: 'Einzelzimmer'};
      waitinglistService.allowRegistrationForWaitinglistEntry(args, function (err) {
        expect(mailNotification, 'Notification was not sent').to.be(undefined);
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });


    it('does not change anything when member is not in waitinglist', function (done) {
      var activity = activityWithEinzelzimmer({_waitinglist: [
        {_memberId: 'otherId'}
      ]});
      var savedActivity;
      sinon.stub(activitystore, 'saveActivity', function (activityToSave, callback) {
        savedActivity = activityToSave;
        callback(null);
      });
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, new Member({id: 'memberId', nickname: 'hansdampf'})); });

      var args = {nickname: 'memberId', activityUrl: 'activity-url', resourcename: 'Einzelzimmer'};
      waitinglistService.allowRegistrationForWaitinglistEntry(args, function (err) {
        expect(savedActivity, 'Activity was not saved').to.be(undefined);
        expect(mailNotification, 'Notification was not sent').to.be(undefined);
        var waitinglistMembers = waitinglistMembersOf(activity, 'Einzelzimmer');
        expect(waitinglistMembers, 'Activity remains unchanged: memberId was not added').to.not.contain('memberId');
        expect(waitinglistMembers, 'Activity remains unchanged: otherId is still there').to.contain('otherId');
        done(err);
      });
    });

    it('gives an error when activity could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(new Error('error')); });
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, new Member({id: 'memberId', nickname: 'hansdampf'})); });

      var args = {nickname: 'memberId', activityUrl: 'activity-url', resourcename: 'Einzelzimmer'};
      waitinglistService.allowRegistrationForWaitinglistEntry(args, function (err) {
        expect(mailNotification, 'Notification was not sent').to.be(undefined);
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });

    it('gives an error when member could not be loaded', function (done) {
      sinon.stub(activitystore, 'getActivity', function (id, callback) { callback(null, new Activity()); });
      sinon.stub(memberstore, 'getMember', function (id, callback) { callback(new Error('error')); });

      var args = {nickname: 'memberId', activityUrl: 'activity-url', resourcename: 'Einzelzimmer'};
      waitinglistService.allowRegistrationForWaitinglistEntry(args, function (err) {
        expect(mailNotification, 'Notification was not sent').to.be(undefined);
        expect(err, 'Error').to.exist();
        done(); // error condition - do not pass err
      });
    });
  });

});
