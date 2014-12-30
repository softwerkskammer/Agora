'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var memberstore = beans.get('memberstore');
var participantstore = beans.get('participantstore');
var Member = beans.get('member');
var Participant = beans.get('participant');

var createApp = require('../../../softwerkskammer/testutil/testHelper')('socratesMembersApp').createApp;

describe('SoCraTes members application', function () {
  var appWithMember;

  before(function () {
    appWithMember = request(createApp('memberId'));
  });

  var member1;
  var member2;
  var participant1;
  var participant2;

  beforeEach(function () {
    member1 = new Member({
      id: 'memberId',
      nickname: 'hada',
      email: 'a@b.c',
      site: 'http://my.blog',
      firstname: 'Hans',
      lastname: 'Dampf',
      authentications: []
    });
    participant1 = new Participant({id: 'memberId'});

    member2 = new Member({
      id: 'memberId2',
      nickname: 'nini',
      email: 'x@y.com',
      site: 'http://my.blog',
      firstname: 'Petra',
      lastname: 'Meier',
      authentications: []
    });
    participant2 = new Participant({id: 'memberId2'});
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('accessing a member page', function () {

    it('gives a 404 if there is no matching member in the database', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null); });

      appWithMember
        .get('/hada')
        .expect(404, done);
    });

    it('gives a 404 if there is a member but no matching participant in the database', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, member1); });
      sinon.stub(participantstore, 'getParticipant', function (nickname, callback) { callback(null); });

      appWithMember
        .get('/hada')
        .expect(404, done);
    });

    it('shows the participant\'s own page', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, member1); });
      sinon.stub(participantstore, 'getParticipant', function (nickname, callback) { callback(null, participant1); });

      appWithMember
        .get('/hada')
        .expect(200)
        .expect(/First name:<\/strong> Hans/)
        .expect(/Last name:<\/strong> Dampf/, done);
    });

    it('shows a different participant\'s page', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, member2); });
      sinon.stub(participantstore, 'getParticipant', function (nickname, callback) { callback(null, participant2); });

      appWithMember
        .get('/nini')
        .expect(200)
        .expect(/First name:<\/strong> Petra/)
        .expect(/Last name:<\/strong> Meier/, done);
    });

  });

});