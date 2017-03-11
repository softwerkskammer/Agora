/* eslint no-underscore-dangle: 0 */
'use strict';

const request = require('supertest');
const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');
const moment = require('moment-timezone');

const config = require('../../testutil/configureForTest');
const beans = config.get('beans');
const cache = config.get('cache');
const userWithoutMember = require('../../testutil/userWithoutMember');
const membersService = beans.get('membersService');
const memberstore = beans.get('memberstore');
const socratesMembersService = beans.get('socratesMembersService');
const subscriberService = beans.get('subscriberService');
const subscriberstore = beans.get('subscriberstore');
const socratesNotifications = beans.get('socratesNotifications');
const groupsAndMembersService = beans.get('groupsAndMembersService');
const Member = beans.get('member');
const Subscriber = beans.get('subscriber');
const currentYear = beans.get('socratesConstants').currentYear;

const events = beans.get('events');
const GlobalEventStore = beans.get('GlobalEventStore');
const eventstore = beans.get('eventstore');

const createApp = require('../../testutil/testHelper')('socratesMembersApp').createApp;

const aShortTimeAgo = moment.tz().subtract(10, 'minutes');

describe('SoCraTes members application', () => {
  let appWithoutMember;
  let appWithSoftwerkskammerMember;
  let appWithSocratesMember;
  let softwerkskammerMember;
  let socratesMember;
  let softwerkskammerSubscriber;
  let socratesSubscriber;
  let eventStore;

  beforeEach(() => {
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

  beforeEach(() => {
    /* eslint camelcase: 0 */
    cache.flushAll();

    eventStore = new GlobalEventStore();
    eventStore.state.events = [
      events.roomQuotaWasSet('single', 10),
      events.roomQuotaWasSet('bed_in_double', 10),
      events.roomQuotaWasSet('junior', 10),
      events.roomQuotaWasSet('bed_in_junior', 10)
    ];

    sinon.stub(eventstore, 'getEventStore', (url, callback) => callback(null, eventStore));

    sinon.stub(memberstore, 'getMembersForIds', (ids, callback) => {
      const members = [];
      if (ids.indexOf('memberId') > -1) {
        members.push(softwerkskammerMember);
      }
      if (ids.indexOf('memberId2') > -1) {
        members.push(socratesMember);
      }
      callback(null, members);
    });
    sinon.stub(membersService, 'putAvatarIntoMemberAndSave', (member, callback) => callback());
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('accessing a member page', () => {

    it('gives a 404 if there is no matching member in the database', done => {
      sinon.stub(memberstore, 'getMember', (nickname, callback) => { callback(null); });

      appWithSoftwerkskammerMember
        .get('/hada')
        .expect(404, done);
    });

    it('gives a 404 if there is a member but no matching subscriber in the database', done => {
      sinon.stub(memberstore, 'getMember', (nickname, callback) => { callback(null, softwerkskammerMember); });
      sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null); });

      appWithSoftwerkskammerMember
        .get('/hada')
        .expect(404, done);
    });

    it('shows the subscriber\'s own page for a Softwerkskammer member', done => {
      sinon.stub(memberstore, 'getMember', (nickname, callback) => { callback(null, softwerkskammerMember); });
      sinon.stub(memberstore, 'getMemberForId', (nickname, callback) => { callback(null, softwerkskammerMember); });
      sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, softwerkskammerSubscriber); });

      appWithSoftwerkskammerMember
        .get('/hada')
        .expect(200)
        .expect(/First name:&nbsp;<\/strong>Hans/)
        .expect(/Last name:&nbsp;<\/strong>Dampf/, done);
    });

    it('shows the subscriber\'s own page for a non-Softwerkskammer member', done => {
      sinon.stub(memberstore, 'getMember', (nickname, callback) => { callback(null, socratesMember); });
      sinon.stub(memberstore, 'getMemberForId', (nickname, callback) => { callback(null, socratesMember); });
      sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

      appWithSocratesMember
        .get('/nini')
        .expect(200)
        .expect(/First name:&nbsp;<\/strong>Petra/)
        .expect(/Last name:&nbsp;<\/strong>Meier/, done);
    });

    it('shows a different subscriber\'s page', done => {
      sinon.stub(memberstore, 'getMember', (nickname, callback) => { callback(null, socratesMember); });
      sinon.stub(memberstore, 'getMemberForId', (nickname, callback) => { callback(null, socratesMember); });
      sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

      appWithSoftwerkskammerMember
        .get('/nini')
        .expect(200)
        .expect(/First name:&nbsp;<\/strong>Petra/)
        .expect(/Last name:&nbsp;<\/strong>Meier/, done);
    });

    describe('displaying the associated roommate in the profile', () => {

      beforeEach(() => {

        sinon.stub(memberstore, 'getMember', (nickname, callback) => {
          if (nickname === 'hada') {
            return callback(null, softwerkskammerMember);
          }
          if (nickname === 'nini') {
            return callback(null, socratesMember);
          }
          callback(null, undefined);
        });
        sinon.stub(memberstore, 'getMemberForId', (id, callback) => {
          if (id === 'memberId') {
            return callback(null, softwerkskammerMember);
          }
          if (id === 'memberId2') {
            return callback(null, socratesMember);
          }
          callback(null, undefined);
        });
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });
      });

      it('does not display anything about roommates if the subscriber is not a participant', done => {

        appWithSocratesMember
          .get('/nini')
          .expect(200, (err, res) => {
            expect(res.text).to.not.contain('Your roommate');
            done(err);
          });
      });

      it('does not display anything about roommates if the subscriber is in a single-bed room', done => {
        eventStore.state.events = eventStore.state.events.concat([
          events.registeredParticipantFromWaitinglist('single', 3, 'memberId2', aShortTimeAgo)
        ]);
        socratesSubscriber.state.participations[currentYear] = {};

        appWithSocratesMember
          .get('/nini')
          .expect(200, (err, res) => {
            expect(res.text).to.not.contain('Your roommate');
            done(err);
          });
      });

      it('displays other unmatched roommates if the subscriber is in a double-bed room but has no roommate associated', done => {
        eventStore.state.events = eventStore.state.events.concat([
          events.registeredParticipantFromWaitinglist('bed_in_double', 3, 'memberId', aShortTimeAgo),
          events.registeredParticipantFromWaitinglist('bed_in_double', 3, 'memberId2', aShortTimeAgo)
        ]);
        socratesSubscriber.state.participations[currentYear] = {};

        appWithSocratesMember
          .get('/nini')
          .expect(200)
          .expect(/Your roommate:&nbsp;<\/strong>You do not have a roommate yet./)
          .expect(/<dd>Hans Dampf&nbsp;<\/dd>/, (err, res) => {
            expect(res.text).to.not.contain('<dd>Petra Meier');
            done(err);
          });
      });

      it('displays the name of the roommate if the subscriber is in a double-bed room and has a roommate associated', done => {
        eventStore.state.events = eventStore.state.events.concat([
          events.registeredParticipantFromWaitinglist('bed_in_double', 3, 'memberId', aShortTimeAgo),
          events.registeredParticipantFromWaitinglist('bed_in_double', 3, 'memberId2', aShortTimeAgo),
          events.roomPairWasAdded('bed_in_double', 'memberId', 'memberId2')
        ]);
        socratesSubscriber.state.participations[currentYear] = {};

        appWithSocratesMember
          .get('/nini')
          .expect(200)
          .expect(/Your roommate:&nbsp;<\/strong>Hans Dampf/, done);
      });

      it('does not display anything about roommates on a different member\'s profile', done => {
        eventStore.state.events = eventStore.state.events.concat([
          events.registeredParticipantFromWaitinglist('bed_in_double', 3, 'memberId', aShortTimeAgo),
          events.registeredParticipantFromWaitinglist('bed_in_double', 3, 'memberId2', aShortTimeAgo),
          events.roomPairWasAdded('bed_in_double', 'memberId', 'memberId2')
        ]);
        socratesSubscriber.state.participations[currentYear] = {};

        appWithSocratesMember
          .get('/hada')
          .expect(200, (err, res) => {
            expect(res.text).to.not.contain('Your roommate');
            done(err);
          });
      });
    });

  });

  describe('editing a subscriber page', () => {

    describe('initially creates an account', () => {
      it('allows somebody who is neither member nor subscriber to create his account', done => {
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(); });

        appWithoutMember
          .get('/edit')
          .expect(200)
          .expect(/In order to keep you informed about the SoCraTes conference, we need you to provide us with the following information\. Please fill in all mandatory fields\./, done);
      });

      it('allows a SoCraTes-only member to edit his page', done => {
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Here you can edit your information\./, done);
      });

      it('allows a Softwerkskammer member to edit his page', done => {
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, softwerkskammerSubscriber); });

        appWithSoftwerkskammerMember
          .get('/edit')
          .expect(200)
          .expect(/Here you find the information from your Softwerkskammer account that is used by SoCraTes\./, done);
      });
    });

    describe('- entering a desired roommate', () => {
      it('does not allow an unregistered subscriber to enter a roommate', done => {
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .end((err, res) => {
            expect(res.text).to.not.contain('Who do you want to share your room with');
            done(err);
          });
      });

      it('does not allow a subscriber who is registered for a single-bed-room to enter a desired roommate', done => {
        eventStore.state.events = eventStore.state.events.concat([
          events.registeredParticipantFromWaitinglist('single', 3, 'memberId2', aShortTimeAgo)
        ]);
        socratesSubscriber.state.participations[currentYear] = {};
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/)
          .end((err, res) => {
            expect(res.text).to.not.contain('Who do you want to share your room with');
            done(err);
          });
      });

      it('does not allow a subscriber who is registered for an exclusive junior room to enter a desired roommate', done => {
        eventStore.state.events = eventStore.state.events.concat([
          events.registeredParticipantFromWaitinglist('junior', 3, 'memberId2', aShortTimeAgo)
        ]);
        socratesSubscriber.state.participations[currentYear] = {};
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/)
          .end((err, res) => {
            expect(res.text).to.not.contain('Who do you want to share your room with');
            done(err);
          });
      });

      it('allows a subscriber who is registered for a bed in a double-bed room to enter a desired roommate', done => {
        eventStore.state.events = eventStore.state.events.concat([
          events.registeredParticipantFromWaitinglist('bed_in_double', 3, 'memberId2', aShortTimeAgo)
        ]);
        socratesSubscriber.state.participations[currentYear] = {};
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/)
          .expect(/You have chosen to share a room with another participant/, done);
      });

      it('allows a subscriber who is registered for a bed in a junior room to enter a desired roommate', done => {
        eventStore.state.events = eventStore.state.events.concat([
          events.registeredParticipantFromWaitinglist('bed_in_junior', 3, 'memberId2', aShortTimeAgo)
        ]);
        socratesSubscriber.state.participations[currentYear] = {};
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/)
          .expect(/You have chosen to share a room with another participant/, done);
      });
    });

    describe('- entering the home address', () => {
      it('does not allow an unregistered subscriber to enter the home address', done => {
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, softwerkskammerSubscriber); });

        appWithSoftwerkskammerMember
          .get('/edit')
          .expect(200)
          .end((err, res) => {
            expect(res.text).to.not.contain('Home Address');
            done(err);
          });
      });

      it('does allow a registered subscriber to enter the home address, even if he is not participating this year', done => {
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit')
          .expect(200)
          .expect(/Home Address/, done);
      });

    });

    it('allows a subscriber who is registered to enter the home address', done => {
      eventStore.state.events = eventStore.state.events.concat([
        events.registeredParticipantFromWaitinglist('bed_in_double', 3, 'memberId2', aShortTimeAgo)
      ]);
      sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

      appWithSocratesMember
        .get('/edit')
        .expect(200)
        .expect(/Home Address/, done);
    });

  });

  describe('editing a subscriber page as superuser', () => {

    describe('- entering the home address', () => {
      it('does not allow a superuser to enter the home address of a subscriber that never participated', done => {
        sinon.stub(memberstore, 'getMember', (nickname, callback) => { callback(null, softwerkskammerMember); });
        sinon.stub(memberstore, 'getMemberForId', (nickname, callback) => { callback(null, softwerkskammerMember); });
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, softwerkskammerSubscriber); });

        request(createApp({id: 'superuserID'}))
          .get('/edit/hada')
          .expect(200)
          .end((err, res) => {
            expect(res.text).to.not.contain('Home Address');
            done(err);
          });
      });

      it('allows a superuser to enter the home address, even if he is not participating this year', done => {
        sinon.stub(memberstore, 'getMember', (nickname, callback) => { callback(null, socratesMember); });
        sinon.stub(memberstore, 'getMemberForId', (nickname, callback) => { callback(null, socratesMember); });
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        request(createApp({id: 'superuserID'}))
          .get('/edit/nini')
          .expect(200)
          .expect(/Home Address/, done);
      });

      it('does not allow a normal user to edit another person\'s profile', done => {
        sinon.stub(memberstore, 'getMember', (nickname, callback) => { callback(null, socratesMember); });
        sinon.stub(memberstore, 'getMemberForId', (nickname, callback) => { callback(null, socratesMember); });
        sinon.stub(subscriberstore, 'getSubscriber', (nickname, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .get('/edit/hada')
          .expect(404, done);
      });

    });

  });

  describe('submitting a member form', () => {

    it('rejects a member with invalid and different nickname on submit', done => {
      sinon.stub(membersService, 'isValidNickname', (nickname, callback) => {
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

    it('rejects a member with invalid and different email address on submit', done => {
      sinon.stub(membersService, 'isValidEmail', (nickname, callback) => {
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

    it('rejects a member with missing first and last name on submit', done => {
      appWithSoftwerkskammerMember
        .post('/submit')
        .send('id=0815&&nickname=hada&previousNickname=hada&email=here@there.org&previousEmail=here@there.org')
        .expect(200)
        .expect(/Failed/)
        .expect(/Validation/)
        .expect(/First name is required\./)
        .expect(/Last name is required\./, done);
    });

    it('rejects a member with missing first name who validly changed their nickname and mailaddress on submit', done => {
      // attention: This combination is required to prove the invocations of the callbacks in case of no error!
      sinon.stub(membersService, 'isValidNickname', (nickname, callback) => {
        callback(null, true);
      });
      sinon.stub(membersService, 'isValidEmail', (nickname, callback) => {
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

    it('rejects a member with invalid nickname and email address on submit, giving two error messages', done => {
      sinon.stub(membersService, 'isValidNickname', (nickname, callback) => {
        callback(null, false);
      });
      sinon.stub(membersService, 'isValidEmail', (nickname, callback) => {
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

    it('saves an existing Softwerkskammer member, creates a subscriber because it is not yet there, and does not trigger notification sending', done => {
      let subscriberSaved = false;
      sinon.stub(membersService, 'isValidNickname', (nickname, callback) => { callback(null, true); });
      sinon.stub(membersService, 'isValidEmail', (nickname, callback) => { callback(null, true); });
      sinon.stub(memberstore, 'saveMember', (member, callback) => { callback(null); });
      const subscriberSave = sinon.stub(subscriberstore, 'saveSubscriber', (subscriber, callback) => {
        subscriberSaved = true;
        callback(null);
      });
      const notificationCall = sinon.stub(socratesNotifications, 'newSoCraTesMemberRegistered', () => undefined);

      // the following stub indicates that the member already exists
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', (nickname, callback) => { callback(null, softwerkskammerMember); });
      // and that the subscriber is not yet there at first call
      sinon.stub(subscriberstore, 'getSubscriber', (id, callback) => {
        if (subscriberSaved) { return callback(null, softwerkskammerSubscriber); }
        callback(null);
      });
      appWithSoftwerkskammerMember
        .post('/submit')
        .send('id=0815&firstname=A&lastname=B')
        .send('nickname=nickerinack&country=XX')
        .send('email=here@there.org')
        .send('homeAddress=home')
        .send('hasParticipationInformation=true')
        .expect(302)
        .expect('location', '/', err => {
          expect(subscriberSave.called).to.be(true);
          expect(notificationCall.called).to.be(false);
          done(err);
        });
    });

    describe('for exisiting members with subscribers', () => {

      it('saves an existing SoCraTes member, creates no subscriber because it is already there, and does not trigger notification sending; forwards to root page', done => {
        sinon.stub(membersService, 'isValidNickname', (nickname, callback) => { callback(null, true); });
        sinon.stub(membersService, 'isValidEmail', (nickname, callback) => { callback(null, true); });
        sinon.stub(memberstore, 'saveMember', (member, callback) => { callback(null); });
        const subscriberSave = sinon.stub(subscriberstore, 'saveSubscriber', (subscriber, callback) => { callback(null); });
        const notificationCall = sinon.stub(socratesNotifications, 'newSoCraTesMemberRegistered', () => undefined);

        // the following stub indicates that the member already exists
        sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', (nickname, callback) => { callback(null, socratesMember); });
        // and that the subscriber also exists
        sinon.stub(subscriberstore, 'getSubscriber', (id, callback) => { callback(null, socratesSubscriber); });

        appWithSocratesMember
          .post('/submit')
          .send('id=0815&firstname=A&lastname=B')
          .send('nickname=nickerinack&country=AB')
          .send('email=here@there.org')
          .send('homeAddress=home')
          .send('hasParticipationInformation=true')
          .expect(302)
          .expect('location', '/', err => {
            expect(subscriberSave.called).to.be(true);
            expect(notificationCall.called).to.be(false);
            done(err);
          });
      });

    });

    it('saves a new SoCraTes member and a new subscriber and triggers notification sending', done => {
      let subscriberSaved = false;
      sinon.stub(membersService, 'isValidNickname', (nickname, callback) => { callback(null, true); });
      sinon.stub(membersService, 'isValidEmail', (nickname, callback) => { callback(null, true); });
      sinon.stub(memberstore, 'allMembers', callback => { callback(null, [softwerkskammerMember, socratesMember]); });
      sinon.stub(memberstore, 'saveMember', (member, callback) => { callback(null); });
      const subscriberSave = sinon.stub(subscriberstore, 'saveSubscriber', (subscriber, callback) => {
        subscriberSaved = true;
        callback(null);
      });
      const notificationCall = sinon.stub(socratesNotifications, 'newSoCraTesMemberRegistered', () => undefined);

      // the following stub indicates that the member does not exist yet
      sinon.stub(groupsAndMembersService, 'getMemberWithHisGroups', (nickname, callback) => { callback(null); });
      // and that the subscriber does not exist either
      sinon.stub(subscriberstore, 'getSubscriber', (id, callback) => {
        if (subscriberSaved) { return callback(null, socratesSubscriber); }
        callback(null);
      });
      appWithSocratesMember
        .post('/submit')
        .send('id=0815&firstname=A&lastname=B')
        .send('nickname=nickerinack&country=WW')
        .send('email=here@there.org')
        .send('homeAddress=home')
        .send('hasParticipationInformation=true')
        .expect(302)
        .expect('location', '/', err => {
          expect(subscriberSave.called).to.be(true);
          expect(notificationCall.called).to.be(true);
          done(err);
        });
    });

  });

  describe('submitting deletion of a member', () => {
    beforeEach(() => {
      sinon.stub(subscriberstore, 'getSubscriberByNickname', (nicknameOfEditMember, callback) => {
        callback(null, socratesSubscriber);
      });
    });

    it('refuses permission and redirects to the profile page', done => {
      appWithSocratesMember
        .post('/delete')
        .send('nickname=someNick')
        .expect(302)
        .expect('location', '/members/someNick', err => {
          done(err);
        });
    });

    it('refuses deletion when the subscriber is also participant and redirects to the profile page', done => {
      sinon.stub(socratesMembersService, 'participationStatus', (subscriber, callback) => {
        callback(null, true);
      });

      request(createApp({id: 'superuserID'}))
        .post('/delete')
        .send('nickname=someNick')
        .expect(302)
        .expect('location', '/members/someNick', err => {
          done(err);
        });
    });

    it('deletes a subscriber that is not participant and redirects to the profiles overview page of current year', done => {
      sinon.stub(socratesMembersService, 'participationStatus', (subscriber, callback) => {
        callback(null, false);
      });

      const deleteCall = sinon.stub(subscriberService, 'removeSubscriber', (subscriber, callback) => {
        callback(null);
      });

      request(createApp({id: 'superuserID'}))
        .post('/delete')
        .send('nickname=someNick')
        .expect(302)
        .expect('location', /participantsOverview/, err => {
          expect(deleteCall.called).to.be(true);
          done(err);
        });
    });
  });

});
