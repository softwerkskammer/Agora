"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;
var moment = require('moment-timezone');

//var util = require('util');

var beans = require('../configureForTest').get('beans');
var waitinglistAPI = beans.get('waitinglistAPI');
var store = beans.get('waitinglistStore');
var membersAPI = beans.get('membersAPI');
var WaitinglistEntry = beans.get('waitinglistEntry');
var Member = beans.get('member');


var waitinglistEntry1;
var waitinglistEntry2;


describe('Waitinglist API', function () {

  beforeEach(function (done) {
    var member1 = new Member({id: "12345", nickname: "hansdampf"});
    var member2 = new Member({id: "abcxyz", nickname: "nickinick"});

    waitinglistEntry1 = new WaitinglistEntry({_registrantId: "12345", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: moment().toDate()});
    waitinglistEntry2 = new WaitinglistEntry({_registrantId: "abcxyz", _activityName: "Meine Aktivität", _resourceName: "Meine Ressource",
      _registrationDate: moment().toDate()});

    sinon.stub(membersAPI, 'getMemberForId', function (memberId, callback) {
      if (memberId === member1.id) { return callback(null, member1); }
      if (memberId === member2.id) { return callback(null, member2); }
    });
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      if (nickname === member1.nickname) { return callback(null, member1); }
      if (nickname === member2.nickname) { return callback(null, member2); }
    });
    sinon.stub(store, 'saveWaitinglistEntry', function (waitinglistEntry, callback) {
      return callback(null, waitinglistEntry);
    });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  describe('- waitinglist - ', function () {

    it('returns an empty list when the waitinglist is empty', function (done) {
      sinon.stub(store, 'waitinglist', function (callback) {callback(null, []); });
      waitinglistAPI.waitinglist(function (err, waitinglist) {
        expect(waitinglist).to.be.empty;
        done(err);
      });
    });

    it('returns one entry with its member nickname when the waitinglist contains one entry', function (done) {
      sinon.stub(store, 'waitinglist', function (callback) {callback(null, [waitinglistEntry1]); });

      waitinglistAPI.waitinglist(function (err, waitinglist) {
        expect(waitinglist.length).to.equal(1);
        expect(waitinglist[0].registrantNickname).to.equal('hansdampf');
        expect(waitinglist[0].activityUrl()).to.equal('Meine Aktivität');
        expect(waitinglist[0].resourceName()).to.equal('Meine Ressource');
        expect(waitinglist[0].registrationDate()).to.not.be.undefined;
        expect(waitinglist[0].registrationValidUntil()).to.be.undefined;
        done(err);
      });
    });

    it('returns two entries with their member nicknames when the waitinglist contains two entries', function (done) {
      sinon.stub(store, 'waitinglist', function (callback) {callback(null, [waitinglistEntry1, waitinglistEntry2]); });

      waitinglistAPI.waitinglist(function (err, waitinglist) {
        expect(waitinglist.length).to.equal(2);
        expect(waitinglist[0].registrantNickname).to.equal('hansdampf');
        expect(waitinglist[1].registrantNickname).to.equal('nickinick');
        done(err);
      });
    });
  });

  describe('- saveWaitingListEntry -', function () {
    it('saves an entry', function (done) {

      var args = {nickname: 'hansdampf', activityname: 'Meine Aktivität', resourcename: "Meine Ressource", hoursstring: "7"};

      waitinglistAPI.saveWaitinglistEntry(args, function (err, waitinglistEntry) {
        expect(waitinglistEntry.registrantId()).to.equal('12345');
        expect(waitinglistEntry.activityUrl()).to.equal('Meine Aktivität');
        expect(waitinglistEntry.resourceName()).to.equal('Meine Ressource');
        expect(waitinglistEntry.registrationDate()).to.not.be.undefined;
        expect(waitinglistEntry.registrationValidUntil()).to.not.be.undefined;
        done(err);
      });
    });
  });

  describe('- canSubscribe -', function () {
    it('does not allow to subscribe if the registrant is not on the waiting list', function (done) {
      sinon.stub(store, 'waitinglistEntry', function (searchObject, callback) { callback(null, null); });

      waitinglistAPI.canSubscribe('unknownMemberId', 'unknownActivityUrl', 'unknownResourceName', function (err, canSubscribe) {
        expect(canSubscribe).to.be.false;
        done(err);
      });
    });

    it('does not allow to subscribe if the registration is not allowed for the waiting list member', function (done) {
      sinon.stub(store, 'waitinglistEntry', function (searchObject, callback) { callback(null, waitinglistEntry1); });
      waitinglistEntry1.setRegistrationValidityFor();

      waitinglistAPI.canSubscribe('knownMemberId', 'knownActivityUrl', 'knownResourceName', function (err, canSubscribe) {
        expect(canSubscribe).to.be.false;
        done(err);
      });
    });

    it('does not allow to subscribe if the registration timeslot is already past', function (done) {
      sinon.stub(store, 'waitinglistEntry', function (searchObject, callback) { callback(null, waitinglistEntry1); });
      waitinglistEntry1.setRegistrationValidityFor("-1");

      waitinglistAPI.canSubscribe('knownMemberId', 'knownActivityUrl', 'knownResourceName', function (err, canSubscribe) {
        expect(canSubscribe).to.be.false;
        done(err);
      });
    });

    it('allows to subscribe if the registration timeslot is still ongoing', function (done) {
      sinon.stub(store, 'waitinglistEntry', function (searchObject, callback) { callback(null, waitinglistEntry1); });
      waitinglistEntry1.setRegistrationValidityFor("1");

      waitinglistAPI.canSubscribe('knownMemberId', 'knownActivityUrl', 'knownResourceName', function (err, canSubscribe) {
        expect(canSubscribe).to.be.true;
        done(err);
      });
    });
  });

});
