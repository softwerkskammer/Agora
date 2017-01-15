'use strict';

const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();

const beans = require('../../testutil/configureForTest').get('beans');
const subscriberService = beans.get('subscriberService');

const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');
const Subscriber = beans.get('subscriber');
const Member = beans.get('member');

const memberID1 = 'stubbed_member';
const memberID2 = 'another_stubbed_member';

describe('SubscriberService', () => {

  const expectedMember1 = new Member({id: memberID1, email: 'email'});
  const subscriber1 = new Subscriber({id: memberID1, notifyOnWikiChangesSoCraTes: true});
  const error = new Error('some weird problem');

  afterEach(() => {
    sinon.restore();
  });

  describe('getMemberIfSubscriberExists', () => {

    it('returns an error if getMember returns an error', done => {
      sinon.stub(memberstore, 'getMember', (nick, cb) => { cb(error); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', (err, member) => {
        expect(err).to.eql(error);
        expect(member).to.be.falsy();
        done();
      });
    });

    it('returns no member if getMember returns no member', done => {
      sinon.stub(memberstore, 'getMember', (nick, cb) => { cb(null); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', (err, member) => {
        expect(member).to.be.falsy();
        done(err);
      });
    });

    it('returns an error if getSubscriber returns an error', done => {
      sinon.stub(memberstore, 'getMember', (nick, cb) => { cb(null, expectedMember1); });
      sinon.stub(subscriberstore, 'getSubscriber', (nick, cb) => { cb(error); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', (err, member) => {
        expect(err).to.eql(error);
        expect(member).to.be.falsy();
        done();
      });
    });

    it('returns no member if getSubscriber returns no subscriber', done => {
      sinon.stub(memberstore, 'getMember', (nick, cb) => { cb(null, expectedMember1); });
      sinon.stub(subscriberstore, 'getSubscriber', (nick, cb) => { cb(null); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', (err, member) => {
        expect(member).to.be.falsy();
        done(err);
      });
    });

    it('returns a member if getMember and getSubscriber both return a valid result', done => {
      sinon.stub(memberstore, 'getMember', (nick, cb) => { cb(null, expectedMember1); });
      sinon.stub(subscriberstore, 'getSubscriber', (nick, cb) => { cb(null, subscriber1); });

      subscriberService.getMemberIfSubscriberExists('irrelevant', (err, member) => {
        expect(member).to.eql(expectedMember1);
        done(err);
      });
    });
  });

  describe('emailAddressesForWikiNotifications', () => {
    const expectedMember2 = new Member({id: memberID2, email: 'email2'});
    const subscriber2 = new Subscriber({id: memberID2});
    const subscriber3 = new Subscriber({id: 'unknown_member'});

    beforeEach(() => {
      sinon.stub(memberstore, 'getMembersForIds', (ids, cb) => {
        const result = [];
        if (ids.indexOf(memberID1) > -1) { result.push(expectedMember1); }
        if (ids.indexOf(memberID2) > -1) { result.push(expectedMember2); }
        return cb(null, result);
      });
    });

    it('are collected if subscribers are interested', done => {
      sinon.stub(subscriberstore, 'allSubscribers', cb => { cb(null, [subscriber1, subscriber2]); });

      subscriberService.emailAddressesForWikiNotifications((err, emailAddresses) => {
        expect(emailAddresses).to.have.length(1);
        expect(emailAddresses[0]).to.be('email');
        done(err);
      });
    });

    it('are empty if subscribers are not interested', done => {
      sinon.stub(subscriberstore, 'allSubscribers', cb => { cb(null, [subscriber2]); });

      subscriberService.emailAddressesForWikiNotifications((err, emailAddresses) => {
        expect(emailAddresses).to.have.length(0);
        done(err);
      });
    });

    it('are empty if subscribers have no member', done => {
      sinon.stub(subscriberstore, 'allSubscribers', cb => { cb(null, [subscriber3]); });

      subscriberService.emailAddressesForWikiNotifications((err, emailAddresses) => {
        expect(emailAddresses).to.have.length(0);
        done(err);
      });
    });
  });

  describe('removeSubscriber', () => {
    let removeMemberCall;
    let removeSubscriberCall;

    beforeEach(() => {
      expectedMember1.state.socratesOnly = false;

      removeMemberCall = sinon.stub(memberstore, 'removeMember', (subscriber, callback) => {
        callback(null);
      });

      removeSubscriberCall = sinon.stub(subscriberstore, 'removeSubscriber', (subscriber, callback) => {
        callback(null);
      });
    });

    it('removes only the subscriber but not the member if the member is also a regular Softwerkskammer member', done => {
      sinon.stub(memberstore, 'getMemberForId', (subscriberId, callback) => {
        callback(null, expectedMember1);
      });

      subscriberService.removeSubscriber(subscriber1, err => {
        expect(removeSubscriberCall.called).to.be(true);
        expect(removeMemberCall.called).to.be(false);
        done(err);
      });
    });

    it('removes only the subscriber if no matching member could be found', done => {
      sinon.stub(memberstore, 'getMemberForId', (subscriberId, callback) => {
        callback(null);
      });

      subscriberService.removeSubscriber(subscriber1, err => {
        expect(removeSubscriberCall.called).to.be(true);
        expect(removeMemberCall.called).to.be(false);
        done(err);
      });
    });

    it('removes the subscriber and the underlying member if she is not a regular Softwerkskammer member', done => {
      sinon.stub(memberstore, 'getMemberForId', (subscriberId, callback) => {
        callback(null, expectedMember1);
      });

      expectedMember1.state.socratesOnly = true;

      subscriberService.removeSubscriber(subscriber1, err => {
        expect(removeSubscriberCall.called).to.be(true);
        expect(removeMemberCall.called).to.be(true);
        done(err);
      });
    });
  });
});
