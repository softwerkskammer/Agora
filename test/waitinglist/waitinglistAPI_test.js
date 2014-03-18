"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;
var moment = require('moment-timezone');

//var util = require('util');

var beans = require('../../testutil/configureForTest').get('beans');
var waitinglistAPI = beans.get('waitinglistAPI');

var activitystore = beans.get('activitystore');
var membersAPI = beans.get('membersAPI');
var Member = beans.get('member');
var Activity = beans.get('activity');

var activity1;

describe('Waitinglist API', function () {

  beforeEach(function () {
    var member1 = new Member({id: "12345", nickname: "hansdampf"});
    var member2 = new Member({id: "abcxyz", nickname: "nickinick"});
    activity1 = new Activity({id: "Meine Aktivität", url: "myActivity", resources: {"Meine Ressource": {_waitinglist: []}}});

    sinon.stub(membersAPI, 'getMemberForId', function (memberId, callback) {
      if (memberId === member1.id()) { return callback(null, member1); }
      if (memberId === member2.id()) { return callback(null, member2); }
    });
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      if (nickname === member1.nickname()) { return callback(null, member1); }
      if (nickname === member2.nickname()) { return callback(null, member2); }
    });
    sinon.stub(activitystore, 'getActivityForId', function (activity, callback) {
      return callback(null, activity1);
    });
    sinon.stub(activitystore, 'saveActivity', function (activity, callback) { return callback(null); });
    sinon.stub(activitystore, 'getActivity', function (activity, callback) {
      return callback(null, activity1);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('- waitinglist - ', function () {

    it('returns an empty list when the waitinglist is empty', function (done) {
      waitinglistAPI.waitinglistFor('myActivity', function (err, waitinglist) {
        expect(waitinglist).to.be.empty;
        done(err);
      });
    });

    it('returns one entry with its member nickname when the waitinglist contains one entry', function (done) {
      activity1.resourceNamed("Meine Ressource").addToWaitinglist('12345', moment());

      waitinglistAPI.waitinglistFor('myActivity', function (err, waitinglist) {
        expect(waitinglist.length).to.equal(1);
        expect(waitinglist[0].registrantNickname).to.equal('hansdampf');
        expect(waitinglist[0].resourceName()).to.equal('Meine Ressource');
        expect(waitinglist[0].registrationDate()).to.not.be.undefined;
        expect(waitinglist[0].registrationValidUntil()).to.be.undefined;
        done(err);
      });
    });

    it('returns two entries with their member nicknames when the waitinglist contains two entries', function (done) {
      activity1.resourceNamed("Meine Ressource").addToWaitinglist('12345', moment());
      activity1.resourceNamed("Meine Ressource").addToWaitinglist('abcxyz', moment());

      waitinglistAPI.waitinglistFor('myActivity', function (err, waitinglist) {
        expect(waitinglist.length).to.equal(2);
        expect(waitinglist[0].registrantNickname).to.equal('hansdampf');
        expect(waitinglist[1].registrantNickname).to.equal('nickinick');
        done(err);
      });
    });
  });

});
