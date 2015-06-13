'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var subscriberService = beans.get('subscriberService');

var memberstore = beans.get('memberstore');
var subscriberstore = beans.get('subscriberstore');
var Member = beans.get('member');

describe('SubscriberService', function () {

  var expectedMember = new Member({id: 'stubbed_member'});
  var subscriber = {id: 'stubbed_subscriber'};
  var error = new Error('some weird problem');

  describe('getMemberIfSubscriberExists', function () {

    afterEach(function () {
      sinon.restore();
    });

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
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nick, cb) { cb(error); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', function (err, member) {
        expect(err).to.eql(error);
        expect(member).to.be.falsy();
        done();
      });
    });

    it('returns no member if getSubscriber returns no subscriber', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nick, cb) { cb(null); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', function (err, member) {
        expect(member).to.be.falsy();
        done(err);
      });
    });

    it('returns a member if getMember and getSubscriber both return a valid result', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nick, cb) { cb(null, subscriber); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', function (err, member) {
        expect(member).to.eql(expectedMember);
        done(err);
      });
    });

  });
});
