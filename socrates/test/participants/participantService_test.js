'use strict';

var expect = require('must');
var sinon = require('sinon').sandbox.create();
var conf = require('../../testutil/configureForTest');

var beans = conf.get('beans');
var participantService = beans.get('participantService');

var memberstore = beans.get('memberstore');
var participantstore = beans.get('participantstore');
var Member = beans.get('member');

describe('MembersService', function () {

  var expectedMember = new Member({id: 'stubbed_member'});
  var participant = {id: 'stubbed_participant'};
  var error = new Error('some weird problem');

  describe('getMemberIfParticipantExists', function () {

    afterEach(function () {
      sinon.restore();
    });

    it('returns an error if getMember returns an error', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(error); });

      participantService.getMemberIfParticipantExists('irrelevant', function (err, member) {
        expect(err).to.eql(error);
        expect(member).to.be.falsy();
        done();
      });
    });

    it('returns no member if getMember returns no member', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null); });

      participantService.getMemberIfParticipantExists('irrelevant', function (err, member) {
        expect(member).to.be.falsy();
        done(err);
      });
    });

    it('returns an error if getParticipant returns an error', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember); });
      sinon.stub(participantstore, 'getParticipant', function (nick, cb) { cb(error); });  // TODO removing this should fail the test

      participantService.getMemberIfParticipantExists('irrelevant', function (err, member) {
        expect(err).to.eql(error);
        expect(member).to.be.falsy();
        done();
      });
    });

    it('returns no member if getParticipant returns no participant', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember); });
      sinon.stub(participantstore, 'getParticipant', function (nick, cb) { cb(null); });  // TODO removing this should fail the test

      participantService.getMemberIfParticipantExists('irrelevant', function (err, member) {
        expect(member).to.be.falsy();
        done(err);
      });
    });

    it('returns a member if getMember and getParticipant both return a valid result', function (done) {
      sinon.stub(memberstore, 'getMember', function (nick, cb) { cb(null, expectedMember); });
      sinon.stub(participantstore, 'getParticipant', function (nick, cb) { cb(null, participant); }); // TODO removing this should fail the test

      participantService.getMemberIfParticipantExists('irrelevant', function (err, member) {
        expect(member).to.eql(expectedMember);
        done(err);
      });
    });

  });
});
