/* eslint no-underscore-dangle: 0 */
'use strict';

var request = require('supertest');
var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');
var userWithoutMember = require('../../testutil/userWithoutMember');
var membersService = beans.get('membersService');
var memberstore = beans.get('memberstore');
var socratesMembersService = beans.get('socratesMembersService');
var subscriberService = beans.get('subscriberService');
var subscriberstore = beans.get('subscriberstore');
var socratesNotifications = beans.get('socratesNotifications');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var Member = beans.get('member');
var Subscriber = beans.get('subscriber');
var currentYear = beans.get('socratesConstants').currentYear;

var events = beans.get('events');
var GlobalEventStore = beans.get('GlobalEventStore');
var eventstore = beans.get('eventstore');

var createApp = require('../../testutil/testHelper')('socratesMembersApp').createApp;

describe('SoCraTes members application', function () {
  var appWithoutMember;
  var appWithSoftwerkskammerMember;
  var appWithSocratesMember;
  var softwerkskammerMember;
  var socratesMember;
  var softwerkskammerSubscriber;
  var socratesSubscriber;
  var eventStore;

  beforeEach(function () {
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
    softwerkskammerSubscriber = new Subscriber({id: 'memberId'});

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
    socratesSubscriber = new Subscriber({
      id: 'memberId2',
      _addon: {homeAddress: 'at home'},
      participations: {}
    });

    appWithoutMember = request(createApp({middlewares: [userWithoutMember]}));
    appWithSoftwerkskammerMember = request(createApp({
      user: {
        member: softwerkskammerMember,
        subscriber: softwerkskammerSubscriber
      }
    }));
    appWithSocratesMember = request(createApp({user: {member: socratesMember, subscriber: socratesSubscriber}}));
  });

  beforeEach(function () {
    /* eslint camelcase: 0 */

    eventStore = new GlobalEventStore();
    eventStore.state.socratesEvents = [
      events.roomQuotaWasSet('single', 10),
      events.roomQuotaWasSet('bed_in_double', 10),
      events.roomQuotaWasSet('junior', 10),
      events.roomQuotaWasSet('bed_in_junior', 10)
    ];

    sinon.stub(eventstore, 'getEventStore', function (url, callback) { return callback(null, eventStore); });

    sinon.stub(memberstore, 'getMembersForIds', function (ids, callback) {
      var members = [];
      if (ids.indexOf('memberId') > -1) {
        members.push(softwerkskammerMember);
      }
      if (ids.indexOf('memberId2') > -1) {
        members.push(socratesMember);
      }
      callback(null, members);
    });
    sinon.stub(membersService, 'putAvatarIntoMemberAndSave', function (member, callback) {
      callback();
    });
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

    it('gives a 404 if there is a member but no matching subscriber in the database', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, softwerkskammerMember); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null); });

      appWithSoftwerkskammerMember
        .get('/hada')
        .expect(404, done);
    });

    it('shows the subscriber\'s own page for a Softwerkskammer member', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, softwerkskammerMember); });
      sinon.stub(memberstore, 'getMemberForId', function (nickname, callback) { callback(null, softwerkskammerMember); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, softwerkskammerSubscriber); });

      appWithSoftwerkskammerMember
        .get('/hada')
        .expect(200)
        .expect(/First name:&nbsp;<\/strong>Hans/)
        .expect(/Last name:&nbsp;<\/strong>Dampf/, done);
    });

    it('shows the subscriber\'s own page for a non-Softwerkskammer member', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, socratesMember); });
      sinon.stub(memberstore, 'getMemberForId', function (nickname, callback) { callback(null, socratesMember); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

      appWithSocratesMember
        .get('/nini')
        .expect(200)
        .expect(/First name:&nbsp;<\/strong>Petra/)
        .expect(/Last name:&nbsp;<\/strong>Meier/, done);
    });

    it('shows a different subscriber\'s page', function (done) {
      sinon.stub(memberstore, 'getMember', function (nickname, callback) { callback(null, socratesMember); });
      sinon.stub(memberstore, 'getMemberForId', function (nickname, callback) { callback(null, socratesMember); });
      sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

      appWithSoftwerkskammerMember
        .get('/nini')
        .expect(200)
        .expect(/First name:&nbsp;<\/strong>Petra/)
        .expect(/Last name:&nbsp;<\/strong>Meier/, done);
    });

    describe('displaying the associated roommate in the profile', function () {

      beforeEach(function () {
        sinon.stub(memberstore, 'getMember', function (nickname, callback) {
          if (nickname === 'hada') {
            return callback(null, softwerkskammerMember);
          }
          if (nickname === 'nini') {
            return callback(null, socratesMember);
          }
          callback(null, undefined);
        });
        sinon.stub(memberstore, 'getMemberForId', function (id, callback) {
          if (id === 'memberId') {
            return callback(null, softwerkskammerMember);
          }
          if (id === 'memberId2') {
            return callback(null, socratesMember);
          }
          callback(null, undefined);
        });
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });
      });

      it('does not display anything about roommates if the subscriber is not a participant', function (done) {

        appWithSocratesMember
          .get('/nini')
          .expect(200, function (err, res) {
            expect(res.text).to.not.contain('Your roommate');
            done(err);
          });
      });

      it('does not display anything about roommates if the subscriber is in a single-bed room', function (done) {
        eventStore.state.registrationEvents = [
          events.participantWasRegistered('single', 3, 'session-id', 'memberId2')
        ];
        socratesSubscriber.state.participations[currentYear] = {};

        appWithSocratesMember
          .get('/nini')
          .expect(200, function (err, res) {
            expect(res.text).to.not.contain('Your roommate');
            done(err);
          });
      });

      it('displays other unmatched roommates if the subscriber is in a double-bed room but has no roommate associated', function (done) {
        eventStore.state.registrationEvents = [
          events.participantWasRegistered('bed_in_double', 3, 'session-id', 'memberId'),
          events.participantWasRegistered('bed_in_double', 3, 'session-id-2', 'memberId2')
        ];
        socratesSubscriber.state.participations[currentYear] = {};

        appWithSocratesMember
          .get('/nini')
          .expect(200)
          .expect(/Your roommate:&nbsp;<\/strong>You do not have a roommate yet./)
          .expect(/<dd>Hans Dampf&nbsp;<\/dd>/, function (err, res) {
            expect(res.text).to.not.contain('<dd>Petra Meier');
            done(err);
          });
      });

      it('displays the name of the roommate if the subscriber is in a double-bed room and has a roommate associated', function (done) {
        eventStore.state.registrationEvents = [
          events.participantWasRegistered('bed_in_double', 3, 'session-id', 'memberId'),
          events.participantWasRegistered('bed_in_double', 3, 'session-id-2', 'memberId2')
        ];
        eventStore.state.roomsEvents = [
          events.roomPairWasAdded('bed_in_double', 'memberId', 'memberId2')
        ];
        socratesSubscriber.state.participations[currentYear] = {};

        appWithSocratesMember
          .get('/nini')
          .expect(200)
          .expect(/Your roommate:&nbsp;<\/strong>Hans Dampf/, done);
      });

      it('does not display anything about roommates on a different member\'s profile', function (done) {
        eventStore.state.registrationEvents = [
          events.participantWasRegistered('bed_in_double', 3, 'session-id', 'memberId'),
          events.participantWasRegistered('bed_in_double', 3, 'session-id-2', 'memberId2')
        ];
        eventStore.state.roomsEvents = [
          events.roomPairWasAdded('bed_in_double', 'memberId', 'memberId2')
        ];
        socratesSubscriber.state.participations[currentYear] = {};

        appWithSocratesMember
          .get('/hada')
          .expect(200, function (err, res) {
            expect(res.text).to.not.contain('Your roommate');
            done(err);
          });
      });
    });

  });

  describe('editing a subscriber page', function () {

    describe('initially creates an account', function () {
      it('allows somebody who is neither member nor subscriber to create his account', function (done) {
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(); });

        appWithoutMember
          .get('/edit')
          .expect(200)
          .expect(/In order to keep you informed about the SoCraTes conference, we need you to provide us with the following information\. Please fill in all mandatory fields\./, done);
      });

      it('allows a SoCraTes-only member to edit his page', function (done) {
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Here you can edit your information\./, done);
      });

      it('allows a Softwerkskammer member to edit his page', function (done) {
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, softwerkskammerSubscriber); });

        appWithSoftwerkskammerMember
          .get('/edit')
          .expect(200)
          .expect(/Here you find the information from your Softwerkskammer account that is used by SoCraTes\./, done);
      });
    });

    describe('- entering a desired roommate', function () {
      it('does not allow an unregistered subscriber to enter a roommate', function (done) {
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .end(function (err, res) {
            expect(res.text).to.not.contain('Who do you want to share your room with');
            done(err);
          });
      });

      it('does not allow a subscriber who is registered for a single-bed-room to enter a desired roommate', function (done) {
        eventStore.state.registrationEvents = [
          events.participantWasRegistered('single', 3, 'session-id', 'memberId2')
        ];
        socratesSubscriber.state.participations[currentYear] = {};
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/)
          .end(function (err, res) {
            expect(res.text).to.not.contain('Who do you want to share your room with');
            done(err);
          });
      });

      it('does not allow a subscriber who is registered for an exclusive junior room to enter a desired roommate', function (done) {
        eventStore.state.registrationEvents = [
          events.participantWasRegistered('junior', 3, 'session-id', 'memberId2')
        ];
        socratesSubscriber.state.participations[currentYear] = {};
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/)
          .end(function (err, res) {
            expect(res.text).to.not.contain('Who do you want to share your room with');
            done(err);
          });
      });

      it('allows a subscriber who is registered for a bed in a double-bed room to enter a desired roommate', function (done) {
        eventStore.state.registrationEvents = [
          events.participantWasRegistered('bed_in_double', 3, 'session-id', 'memberId2')
        ];
        socratesSubscriber.state.participations[currentYear] = {};
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/)
          .expect(/Who do you want to share your room with/, done);
      });

      it('allows a subscriber who is registered for a bed in a junior room to enter a desired roommate', function (done) {
        eventStore.state.registrationEvents = [
          events.participantWasRegistered('bed_in_junior', 3, 'session-id', 'memberId2')
        ];
        socratesSubscriber.state.participations[currentYear] = {};
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/)
          .expect(/Who do you want to share your room with/, done);
      });
    });

    describe('- entering the home address', function () {
      it('does not allow an unregistered subscriber to enter the home address', function (done) {
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, softwerkskammerSubscriber); });

        appWithSoftwerkskammerMember
          .get('/edit')
          .expect(200)
          .end(function (err, res) {
            expect(res.text).to.not.contain('Home Address');
            done(err);
          });
      });

      it('does allow a registered subscriber to enter the home address, even if he is not participating this year', function (done) {
        sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/, done);
      });

    });

    it('allows a subscriber who is registered to enter the home address', function (done) {
      eventStore.state.registrationEvents = [
        events.participantWasRegistered('bed_in_double', 3, 'session-id', 'memberId2')
      ];
      sinon.stub(subscriberstore, 'getSubscriber', function (nickname, callback) { callback(null, socratesSubscriber); });

      appWithSocratesMember
        .get('/edit')
        .expect(200)
        .expect(/Home Address/, done);
    });

  });

  describe('submitting a member form', function () {

    it('rejects a member with invalid and different nickname on submit', function (done) {
      sinon.stub(membersService, 'isValidNickname', function (nickname, callback) {
        callback(null, false);
      });

      appWithSoftwerkskammerMember
        .post('/submit')
        .send('id=0815&firstname=A&lastname=B&email=c@d.de&previousEmail=c@d.de')
        .send('nickname=nickerinack')
        .send('previousNickname=bibabu')
        .expect(200)
        .expect(/Failed/)
        .expect(/Validation/)
        .expect(/This nickname is not available\./, done);
    });

    it('rejects a member with invalid and different email address on submit', function (done) {
      sinon.stub(membersService, 'isValidEmail', function (nickname, callback) {
        callback(null, false);
      });

      appWithSoftwerkskammerMember
        .post('/submit')
        .send('id=0815&firstname=Hans&lastname=Dampf&nickname=hada&previousNickname=hada')
        .send('email=here@there.org')
        .send('previousEmail=there@wherever.com')
        .expect(200)
        .expect(/Failed/)
        .expect(/Validation/)
        .expect(/This e-mail address is already registered\./, done);
    });

    it('rejects a member with missing first and last name on submit', function (done) {
      appWithSoftwerkskammerMember
        .post('/submit')
        .send('id=0815&&nickname=hada&previousNickname=hada&email=here@there.org&previousEmail=here@there.org')
        .expect(200)
        .expect(/Failed/)
        .expect(/Validation/)
        .expect(/First name is required\./)
        .expect(/Last name is required\./, done);
    });

    it('rejects a member with missing first name who validly changed their nickname and mailaddress on submit', function (done) {
      // attention: This combination is required to prove the invocations of the callbacks in case of no error!
      sinon.stub(membersService, 'isValidNickname', function (nickname, callback) {
        callback(null, true);
      });
      sinon.stub(membersService, 'isValidEmail', function (nickname, callback) {
        callback(null, true);
      });

      appWithSoftwerkskammerMember
        .post('/submit')
        .send('id=0815&&nickname=hadaNew&previousNickname=hada&lastname=x&email=hereNew@there.org&previousEmail=here@there.org')
        .expect(200)
        .expect(/Failed/)
        .expect(/Validation/)
        .expect(/First name is required\./, done);
    });

    it('rejects a member with invalid nickname and email address on submit, giving two error messages', function (done) {
      sinon.stub(membersService, 'isValidNickname', function (nickname, callback) {
        callback(null, false);
      });
      sinon.stub(membersService, 'isValidEmail', function (nickname, callback) {
        callback(null, false);
      });

      appWithSoftwerkskammerMember
        .post('/submit')
        .send('id=0815&firstname=A&lastname=B')
        .send('nickname=nickerinack')
        .send('previousNickname=hada')
        .send('email=here@there.org')
        .send('previousEmail=there@wherever.com')
        .expect(200)
        .expect(/Failed/)
        .expect(/Validation/)
        .expect(/This nickname is not available\./)
        .expect(/This e-mail address is already registered\./, done);
    });

    it('saves an existing Softwerkskammer member, creates a subscriber because it is not yet there, and does not trigger notification sending', function (done) {
      var subscriberSaved = false;
      sinon.stub(membersService, 'isValidNickname', function (nickname, callback) { callback(null, true); });
      sinon.stub(membersService, 'isValidEmail', function (nickname, callback) { callback(null, true); });
      sinon.stub(memberstore, 'saveMember', function (member, callback) { callback(null); });
      var subscriberSave = sinon.stub(subscriberstore, 'saveSubscriber', function (subscriber, callback) {
        subscriberSaved = true;
        callback(null);
      });
      var notificationCall = sinon.stub(socratesNotifications, 'newSoCraTesMemberRegistered', function () { return undefined; });

      // the following stub indicates that the member already exists
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null, softwerkskammerMember); });
      // and that the subscriber is not yet there at first call
      sinon.stub(subscriberstore, 'getSubscriber', function (id, callback) {
        if (subscriberSaved) { return callback(null, softwerkskammerSubscriber); }
        callback(null);
      });
      appWithSoftwerkskammerMember
        .post('/submit')
        .send('id=0815&firstname=A&lastname=B')
        .send('nickname=nickerinack')
        .send('email=here@there.org')
        .send('homeAddress=home')
        .send('hasParticipationInformation=true')
        .expect(302)
        .expect('location', '/', function (err) {
          expect(subscriberSave.called).to.be(true);
          expect(notificationCall.called).to.be(false);
          done(err);
        });
    });

    describe('for exisiting members with subscribers', function () {

      it('saves an existing SoCraTes member, creates no subscriber because it is already there, and does not trigger notification sending; forwards to root page', function (done) {
        sinon.stub(membersService, 'isValidNickname', function (nickname, callback) { callback(null, true); });
        sinon.stub(membersService, 'isValidEmail', function (nickname, callback) { callback(null, true); });
        sinon.stub(memberstore, 'saveMember', function (member, callback) { callback(null); });
        var subscriberSave = sinon.stub(subscriberstore, 'saveSubscriber', function (subscriber, callback) { callback(null); });
        var notificationCall = sinon.stub(socratesNotifications, 'newSoCraTesMemberRegistered', function () { return undefined; });

        // the following stub indicates that the member already exists
        sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null, socratesMember); });
        // and that the subscriber also exists
        sinon.stub(subscriberstore, 'getSubscriber', function (id, callback) { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .post('/submit')
          .send('id=0815&firstname=A&lastname=B')
          .send('nickname=nickerinack')
          .send('email=here@there.org')
          .send('homeAddress=home')
          .send('hasParticipationInformation=true')
          .expect(302)
          .expect('location', '/', function (err) {
            expect(subscriberSave.called).to.be(true);
            expect(notificationCall.called).to.be(false);
            done(err);
          });
      });

    });

    it('saves a new SoCraTes member and a new subscriber and triggers notification sending', function (done) {
      var subscriberSaved = false;
      sinon.stub(membersService, 'isValidNickname', function (nickname, callback) { callback(null, true); });
      sinon.stub(membersService, 'isValidEmail', function (nickname, callback) { callback(null, true); });
      sinon.stub(memberstore, 'allMembers', function (callback) { callback(null, [softwerkskammerMember, socratesMember]); });
      sinon.stub(memberstore, 'saveMember', function (member, callback) { callback(null); });
      var subscriberSave = sinon.stub(subscriberstore, 'saveSubscriber', function (subscriber, callback) {
        subscriberSaved = true;
        callback(null);
      });
      var notificationCall = sinon.stub(socratesNotifications, 'newSoCraTesMemberRegistered', function () { return undefined; });

      // the following stub indicates that the member does not exist yet
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', function (nickname, callback) { callback(null); });
      // and that the subscriber does not exist either
      sinon.stub(subscriberstore, 'getSubscriber', function (id, callback) {
        if (subscriberSaved) { return callback(null, socratesSubscriber); }
        callback(null);
      });
      appWithSocratesMember
        .post('/submit')
        .send('id=0815&firstname=A&lastname=B')
        .send('nickname=nickerinack')
        .send('email=here@there.org')
        .send('homeAddress=home')
        .send('hasParticipationInformation=true')
        .expect(302)
        .expect('location', '/', function (err) {
          expect(subscriberSave.called).to.be(true);
          expect(notificationCall.called).to.be(true);
          done(err);
        });
    });

  });

  describe('submitting deletion of a member', function () {
    beforeEach(function () {
      sinon.stub(subscriberstore, 'getSubscriberByNickname', function (nicknameOfEditMember, callback) {
        callback(null, socratesSubscriber);
      });
    });

    it('refuses permission and redirects to the profile page', function (done) {
      appWithSocratesMember
        .post('/delete')
        .send('nickname=someNick')
        .expect(302)
        .expect('location', '/members/someNick', function (err) {
          done(err);
        });
    });

    it('refuses deletion when the subscriber is also participant and redirects to the profile page', function (done) {
      sinon.stub(socratesMembersService, 'participationStatus', function (subscriber, callback) {
        callback(null, true);
      });

      request(createApp({id: 'superuserID'}))
        .post('/delete')
        .send('nickname=someNick')
        .expect(302)
        .expect('location', '/members/someNick', function (err) {
          done(err);
        });
    });

    it('deletes a subscriber that is not participant and redirects to the profiles overview page of current year', function (done) {
      sinon.stub(socratesMembersService, 'participationStatus', function (subscriber, callback) {
        callback(null, false);
      });

      var deleteCall = sinon.stub(subscriberService, 'removeSubscriber', function (subscriber, callback) {
        callback(null);
      });

      request(createApp({id: 'superuserID'}))
        .post('/delete')
        .send('nickname=someNick')
        .expect(302)
        .expect('location', /participantsOverview/, function (err) {
          expect(deleteCall.called).to.be(true);
          done(err);
        });
    });
  });

});
