'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');
var accessrights = beans.get('accessrights');
var memberstore = beans.get('memberstore');
var participantstore = beans.get('participantstore');
var Member = beans.get('member');
var Participant = beans.get('participant');

var createApp = require('../../testutil/testHelper')('socratesMembersApp').createApp;

describe('SoCraTes members application', function () {
  var appWithoutMember;
  var appWithSoftwerkskammerMember;
  var appWithSocratesMember;
  var softwerkskammerMember;
  var socratesMember;
  var softwerkskammerParticipant;
  var socratesParticipant;

  before(function () {
    softwerkskammerMember = new Member({
      id: 'memberId',
      nickname: 'hada',
      email: 'a@b.c',
      site: 'http://my.blog',
      firstname: 'Hans',
      lastname: 'Dampf',
      authentications: [],
      socratesOnly: false
    });
    softwerkskammerParticipant = new Participant({id: 'memberId'});

    socratesMember = new Member({
      id: 'memberId2',
      nickname: 'nini',
      email: 'x@y.com',
      site: 'http://my.blog',
      firstname: 'Petra',
      lastname: 'Meier',
      authentications: [],
      socratesOnly: true
    });
    socratesParticipant = new Participant({id: 'memberId2'});

    appWithoutMember = request(createApp({middlewares: [userWithoutMember]}));
    appWithSoftwerkskammerMember = request(createApp({member: softwerkskammerMember}));
    appWithSocratesMember = request(createApp({member: socratesMember}));
  });


  afterEach(function () {
    sinon.restore();
  });

  describe('accessing a member page', function () {

    it('gives a 404 if there is no matching member in the database', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null); });

      appWithSoftwerkskammerMember
        .get('/hada')
        .expect(404, done);
    });

    it('gives a 404 if there is a member but no matching participant in the database', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, softwerkskammerMember); });
      sinon.stub(participantstore, 'getParticipant', function (nickname, callback) { callback(null); });

      appWithSoftwerkskammerMember
        .get('/hada')
        .expect(404, done);
    });

    it('shows the participant\'s own page', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, softwerkskammerMember); });
      sinon.stub(participantstore, 'getParticipant', function (nickname, callback) { callback(null, softwerkskammerParticipant); });

      appWithSoftwerkskammerMember
        .get('/hada')
        .expect(200)
        .expect(/First name:<\/strong> Hans/)
        .expect(/Last name:<\/strong> Dampf/, done);
    });

    it('shows a different participant\'s page', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, socratesMember); });
      sinon.stub(participantstore, 'getParticipant', function (nickname, callback) { callback(null, socratesParticipant); });

      appWithSoftwerkskammerMember
        .get('/nini')
        .expect(200)
        .expect(/First name:<\/strong> Petra/)
        .expect(/Last name:<\/strong> Meier/, done);
    });

  });

  describe('editing a member page', function () {

    it('allows somebody who is neither member nor participant to create his account', function (done) {
      appWithoutMember
        .get('/edit')
        .expect(200)
        .expect(/In order to keep you informed about the SoCraTes conference, we need you to provide us with the following information\. Please fill in all mandatory fields\./, done);
    });

    it('allows a SoCraTes-only member to edit his page', function (done) {
      appWithSocratesMember
        .get('/edit')
        .expect(200)
        .expect(/Here you can edit your information\./, done);
    });

    it('allows a Softwerkskammer member to edit his page', function (done) {
      appWithSoftwerkskammerMember
        .get('/edit')
        .expect(200)
        .expect(/Here you find the information from your Softwerkskammer account that is used by SoCraTes\./, done);
    });

  });

  describe('submitting a member page', function () {

  });

});