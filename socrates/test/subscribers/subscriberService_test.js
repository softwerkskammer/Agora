'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var subscriberService = beans.get('subscriberService');

var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var Subscriber = beans.get('subscriber');
var Member = beans.get('member');

var memberID1 = 'stubbed_member';
var memberID2 = 'another_stubbed_member';

describe('SubscriberService', function () {

  var expectedMember1 = new Member({id: memberID1, email: 'email'});
  var subscriber1 = new Subscriber({id: memberID1, notifyOnWikiChangesSoCraTes: true});
  var error = new Error('some weird problem');

  afterEach(function () {
    sinon.restore();
  });

  describe('getMemberIfSubscriberExists', function () {

    it('returns an error if getMember returns an error', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(error); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', function (err, member) {
        expect(err).to.eql(error);
        expect(member).to.be.falsy();
        done();
      });
    });

    it('returns no member if getMember returns no member', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', function (err, member) {
        expect(member).to.be.falsy();
        done(err);
      });
    });

    it('returns an error if getSubscriber returns an error', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember1); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nick, cb) { cb(error); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', function (err, member) {
        expect(err).to.eql(error);
        expect(member).to.be.falsy();
        done();
      });
    });

    it('returns no member if getSubscriber returns no subscriber', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember1); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nick, cb) { cb(null); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', function (err, member) {
        expect(member).to.be.falsy();
        done(err);
      });
    });

    it('returns a member if getMember and getSubscriber both return a valid result', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember1); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nick, cb) { cb(null, subscriber1); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', function (err, member) {
        expect(member).to.eql(expectedMember1);
        done(err);
      });
    });
  });

  describe('emailAddressesForWikiNotifications', function () {
    var expectedMember2 = new Member({id: memberID2, email: 'email2'});
    var subscriber2 = new Subscriber({id: memberID2});
    var subscriber3 = new Subscriber({id: 'unknown_member'});

    beforeEach(function () {
      sinon.stub(memberstore, 'getMembersForIds', function (ids, cb) {
        var result = [];
        if (ids.indexOf(memberID1) > -1) { result.push(expectedMember1); }
        if (ids.indexOf(memberID2) > -1) { result.push(expectedMember2); }
        return cb(null, result);
      });
    });

    it('are collected if subscribers are interested', function (done) {
      sinon.stub(subscriberstore, 'allSubscribers', function (cb) { cb(null, [subscriber1, subscriber2]); });

      subscriberService.emailAddressesForWikiNotifications(function (err, emailAddresses) {
        expect(emailAddresses).to.have.length(1);
        expect(emailAddresses[0]).to.be('email');
        done(err);
      });
    });

    it('are empty if subscribers are not interested', function (done) {
      sinon.stub(subscriberstore, 'allSubscribers', function (cb) { cb(null, [subscriber2]); });

      subscriberService.emailAddressesForWikiNotifications(function (err, emailAddresses) {
        expect(emailAddresses).to.have.length(0);
        done(err);
      });
    });

    it('are empty if subscribers have no member', function (done) {
      sinon.stub(subscriberstore, 'allSubscribers', function (cb) { cb(null, [subscriber3]); });

      subscriberService.emailAddressesForWikiNotifications(function (err, emailAddresses) {
        expect(emailAddresses).to.have.length(0);
        done(err);
      });
    });
  });

  describe('removeSubscriber', function () {
    beforeEach(function() {
      sinon.stub(subscriberstore, 'removeSubscriber', function (subscriber, callback) {
        callback(null);
      });

      sinon.stub(memberstore, 'getMemberForId', function (subscriberId, callback) {
        callback(null, expectedMember1);
      });
    });

    it('only removes the subscriber the member is also regular Softwerkskammer member', function (done) {
      subscriberService.removeSubscriber(subscriber1, function(err) {
        done(err);
      });
    });

    it('also removes the member if she is also regular Softwerkskammer member', function (done) {
      var removeMemberCall = sinon.stub(memberstore, 'removeMember', function (subscriber, callback) {
        callback(null);
      });
      expectedMember1.state.socratesOnly = true;

      subscriberService.removeSubscriber(subscriber1, function(err) {
        expectedMember1.state.socratesOnly = false;
        expect(removeMemberCall.called).to.be(true);
        done(err);
      });
    });
  });
});
