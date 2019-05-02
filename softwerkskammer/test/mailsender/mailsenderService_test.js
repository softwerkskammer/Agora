'use strict';

const expect = require('must-dist');
const sinon = require('sinon').createSandbox();
const beans = require('../../testutil/configureForTest').get('beans');

const memberstore = beans.get('memberstore');
const groupsService = beans.get('groupsService');
const groupsAndMembersService = beans.get('groupsAndMembersService');
const activitiesService = beans.get('activitiesService');
const activitystore = beans.get('activitystore');

const mailsenderService = beans.get('mailsenderService');
const Activity = beans.get('activity');
const Member = beans.get('member');
const Message = beans.get('message');
const Group = beans.get('group');
const fieldHelpers = beans.get('fieldHelpers');
const transport = beans.get('mailtransport').transport;

let emptyActivity;

const sender = new Member();
let message;
let sendmail;

function singleSentEmail() {
  expect(sendmail.calledOnce).to.be(true);
  return sendmail.args[0][0];
}

function expectNoEmailWasSent() {
  expect(sendmail.called).to.be.false();
}

describe('MailsenderService', () => {
  const activityURL = 'acti_vi_ty';
  const nickname = 'nickyNamy';

  beforeEach(() => {
    const availableGroups = [];
    message = new Message({subject: 'subject', markdown: 'mark down'}, sender);
    emptyActivity = new Activity({
      title: 'Title of the Activity',
      description: 'description1',
      assignedGroup: 'assignedGroup',
      location: 'location1',
      direction: 'direction1',
      startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone('01.01.2013').toJSDate(),
      url: 'urlOfTheActivity'
    });
    sinon.stub(groupsService, 'getAllAvailableGroups').callsFake(callback => { callback(null, availableGroups); });
    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants').callsFake((actURL, callback) => {
      if (actURL === null) { return callback(new Error()); }
      callback(null, emptyActivity);
    });
    sinon.stub(memberstore, 'getMember').callsFake((nick, callback) => {
      if (nick === null) { return callback(null); }
      if (nick === 'broken') { return callback(new Error()); }
      callback(null, new Member({email: 'email@mail.de'}));
    });
    sinon.stub(activitystore, 'getActivity').callsFake((url, callback) => {
      if (url === 'activityUrlForMock') { return callback(null, emptyActivity); }
      callback(new Error());
    });
    sendmail = sinon.stub(transport, 'sendMail').callsFake((transportobject, callback) => {
      if (!transportobject.to && (!transportobject.bcc || transportobject.bcc.length === 0)) {
        // simulating the behaviour of nodemailer
        return callback(new Error());
      }
      callback(null);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('preparing data', () => {
    it('for showing the edit form for an activity', done => {
      mailsenderService.dataForShowingMessageForActivity(activityURL, 'de', (err, result) => {
        expect(result.message).to.exist();
        expect(result.regionalgroups).to.exist();
        expect(result.themegroups).to.exist();
        expect(result.successURL).to.contain(activityURL);
        done(err);
      });
    });

    it('URIescapes the url for an activity', done => {
      const url = 'some%20thing';
      const encodedURL = encodeURIComponent(url);
      mailsenderService.dataForShowingMessageForActivity(url, 'de', (err, result) => {
        expect(result.successURL).to.contain(encodedURL);
        done(err);
      });
    });

    it('for showing the edit form for a member', done => {
      mailsenderService.dataForShowingMessageToMember(nickname, (err, result) => {
        expect(result.message).to.exist();
        expect(result.regionalgroups).not.to.exist();
        expect(result.themegroups).not.to.exist();
        expect(result.successURL).to.contain(nickname);
        done(err);
      });
    });

    it('URIescapes the nickname for a member', done => {
      const nick = 'some%20thing';
      const encodedNick = encodeURIComponent(nick);
      mailsenderService.dataForShowingMessageToMember(nick, (err, result) => {
        expect(result.successURL).to.contain(encodedNick);
        done(err);
      });
    });
  });

  describe('activity markdown', () => {
    it('with direction', () => {
      const activity = new Activity().fillFromUI({
        url: 'url',
        description: 'description',
        location: 'location',
        direction: 'direction',
        startDate: '4.5.2013',
        startTime: '12:21'
      });
      const markdown = mailsenderService.activityMarkdown(activity);
      expect(markdown).to.contain('description');
      expect(markdown).to.contain('4. Mai 2013');
      expect(markdown).to.contain('12:21');
      expect(markdown).to.contain('location');
      expect(markdown).to.contain('Wegbeschreibung');
      expect(markdown).to.contain('direction');
    });

    it('without direction', () => {
      const activity = new Activity({
        url: 'url',
        description: 'description',
        location: 'location',
        direction: '',
        startDate: '4.5.2013',
        startTime: '12:21'
      });
      expect(mailsenderService.activityMarkdown(activity)).to.not.contain('Wegbeschreibung');
    });
  });

  describe('sending mail as reminder for activity', () => {
    it('sends to participants', done => {
      const email = 'emailAddress@e.mail';
      emptyActivity.participants = [new Member({email})];

      mailsenderService.sendMailToParticipantsOf(activityURL, message, (err, statusmessage) => {
        const sendEmail = singleSentEmail();
        expect(sendEmail.bcc).to.contain(email);
        expect(sendEmail.html).to.contain('mark down');
        expect(sendEmail.icalEvent).to.contain('BEGIN:VCALENDAR');
        expect(sendEmail.icalEvent).to.contain('URL:http://localhost:17125/activities/urlOfTheActivity');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('does not send mail if no participants', done => {
      mailsenderService.sendMailToParticipantsOf(activityURL, message, (err, statusmessage) => {
        expect(sendmail.calledOnce).to.be(true);
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done(err);
      });
    });

    it('does not send mail if activity canot be found', done => {
      mailsenderService.sendMailToParticipantsOf(null, message, (err, statusmessage) => {
        expect(sendmail.calledOnce).to.not.be(true);
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending mail to distinct member', () => {
    it('sends the email', done => {
      mailsenderService.sendMailToMember('nickname', message, (err, statusmessage) => {
        const email = singleSentEmail();
        expect(email.bcc).to.contain('email@mail.de');
        expect(email.html).to.contain('mark down');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('does not send the email if member cannot be found', done => {
      mailsenderService.sendMailToMember(null, message, (err, statusmessage) => {
        expect(err).not.to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send the email if finding member causes error', done => {
      mailsenderService.sendMailToMember('broken', message, (err, statusmessage) => {
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending resignment mail', () => {
    const superuser = new Member({id: 'superuserID', email: 'email@super.user'});

    beforeEach(() => {
      sinon.stub(memberstore, 'superUsers').callsFake(callback => { callback(null, [superuser]); });
    });

    it('sends the email', done => {
      const markdown = '';
      const member = new Member({nickname: 'nick', firstname: 'first', lastname: 'last'});
      mailsenderService.sendResignment(markdown, member, (err, statusmessage) => {
        const email = singleSentEmail();
        expect(email.from).to.contain('first last');
        expect(email.subject).to.contain('Austrittswunsch');
        expect(email.to).to.contain('email@super.user');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('does not send the email if member cannot be found', done => {
      mailsenderService.sendMailToMember(null, message, (err, statusmessage) => {
        expect(err).not.to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send the email if finding member causes error', done => {
      mailsenderService.sendMailToMember('broken', message, (err, statusmessage) => {
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending mail as invitation for activity ', () => {
    const groupA = new Group({id: 'groupA'});
    const groupB = new Group({id: 'groupB'});

    beforeEach(() => {
      sinon.stub(groupsService, 'getGroups').callsFake((groupnames, callback) => {
        if (groupnames === null) { return callback(new Error()); }
        if (groupnames.length === 0) { return callback(null, []); }
        callback(null, [groupA, groupB]);
      });
    });

    it('sends to members of selected groups', done => {
      sinon.stub(groupsAndMembersService, 'addMembersToGroup').callsFake((group, callback) => {
        if (group === null) { return callback(null); }
        if (group === groupA) { group.members = [new Member({email: 'memberA'})]; }
        if (group === groupB) { group.members = [new Member({email: 'memberB'})]; }
        group.membercount = 1;
        callback(null, group);
      });
      mailsenderService.sendMailToInvitedGroups(['GroupA', 'GroupB'], 'activityUrlForMock', message, (err, statusmessage) => {
        const email = singleSentEmail();
        expect(email.bcc).to.contain('memberA');
        expect(email.bcc).to.contain('memberB');
        expect(email.html).to.contain('mark down');
        expect(email.icalEvent).to.contain('BEGIN:VCALENDAR');
        expect(email.icalEvent).to.contain('URL:http://localhost:17125/activities/urlOfTheActivity');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('ignores errors finding the activity when sending to members of selected groups', done => {
      sinon.stub(groupsAndMembersService, 'addMembersToGroup').callsFake((group, callback) => {
        if (group === null) { return callback(null); }
        if (group === groupA) { group.members = [new Member({email: 'memberA'})]; }
        if (group === groupB) { group.members = [new Member({email: 'memberB'})]; }
        group.membercount = 1;
        callback(null, group);
      });
      mailsenderService.sendMailToInvitedGroups(['GroupA', 'GroupB'], 'errorProvokingUrl', message, (err, statusmessage) => {
        const email = singleSentEmail();
        expect(email.bcc).to.contain('memberA');
        expect(email.bcc).to.contain('memberB');
        expect(email.html).to.contain('mark down');
        expect(email.icalEvent).to.be(undefined);
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('does not send to members if no groups selected', done => {
      mailsenderService.sendMailToInvitedGroups([], 'activityUrlForMock', message, (err, statusmessage) => {
        expect(sendmail.calledOnce).to.not.be(true);
        expect(err).not.to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send to members if finding groups causes error', done => {
      mailsenderService.sendMailToInvitedGroups(null, 'activityUrlForMock', message, (err, statusmessage) => {
        expect(sendmail.calledOnce).to.not.be(true);
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send to members if filling groups with members causes error', done => {
      sinon.stub(groupsAndMembersService, 'addMembersToGroup').callsFake((group, callback) => {
        callback(new Error());
      });

      mailsenderService.sendMailToInvitedGroups(['GroupA', 'GroupB'], 'activityUrlForMock', message, (err, statusmessage) => {
        expect(sendmail.calledOnce).to.not.be(true);
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

  });

  describe('sending to contact persons of a group', () => {

    function getGroups(groupIdToLookUp, fakeImplementation) {
      return sinon.stub(groupsService, 'getGroups')
        .withArgs([groupIdToLookUp], sinon.match.any)
        .callsFake(fakeImplementation);
    }

    function thereIsAGroup(group) {
      return getGroups(group.id, function (passedGroupName, callback) {
        callback(null, [group]);
      });
    }

    function thereIsNoGroup() {
      return sinon.stub(groupsService, 'getGroups')
        .callsFake(function (passedGroupId, callback) {
          callback(null, []);
        });
    }

    function getGroupFails(groupId) {
      return getGroups(groupId, function (passedGroupNames, callback) {
        callback(new Error('getGroups failed'));
      });
    }

    function getGroupOrganizers(groupId, fakeImplementation){
      return sinon.stub(groupsAndMembersService, 'getOrganizersOfGroup')
        .withArgs(groupId, sinon.match.any)
        .callsFake(fakeImplementation);
    }

    function loadingGroupOrganizersFailsFor(groupId) {
      return getGroupOrganizers(groupId, (passedGroupName, callback) => {
        callback(new Error('no soup for you'));
      });
    }

    function memberWithMailAdress(email) {
      return new Member({
        email: email
      });
    }

    function anyMemberWithEmail() {
      return memberWithMailAdress('any@example.org');
    }

    function groupIsOrganizedBy(groupName, organizers) {
      getGroupOrganizers(groupName, (passedGroupId, callback) => {
        callback(null, organizers);
      });
    }

    function provideValidOrganizersForGroup(groupName) {
      groupIsOrganizedBy(groupName, [anyMemberWithEmail()]);
    }

    const groupId = 'any-group-id';

    describe('when contact organizers is disabled for group', () => {
      const group = new Group({id: groupId, contactTheOrganizers: false});

      beforeEach(() => {
        thereIsAGroup(group);
        provideValidOrganizersForGroup(groupId);
      });

      it('does not send any mail', done => {
        mailsenderService.sendMailToContactPersonsOfGroup(groupId, message, (err, statusMessage) => {
          expect(err).to.not.exist();
          expectNoEmailWasSent();
          expect(statusMessage.contents().type).to.eql('alert-danger');
          expect(statusMessage.contents().additionalArguments.type).to.eql('$t(mailsender.notification)');
          expect(statusMessage.contents().additionalArguments.err).to.eql('$t(mailsender.contact_persons_cannot_be_contacted)');
          done();
        });
      });
    });

    describe('when getting group fails', () => {
      beforeEach(() => {
        getGroupFails(groupId);
      });

      it('does not send any mail to the organizers', done => {
        groupIsOrganizedBy(groupId, [anyMemberWithEmail()]);

        mailsenderService.sendMailToContactPersonsOfGroup(groupId, message, (err, statusMessage) => {
          expect(err).to.exist();
          expectNoEmailWasSent();

          expect(statusMessage.contents().type).to.eql('alert-danger');
          expect(statusMessage.contents().additionalArguments.type).to.eql('$t(mailsender.notification)');
          expect(statusMessage.contents().additionalArguments.err).to.eql('Error: getGroups failed');
          done();
        });
      });
    });

    describe('when group does not exist', () => {
      beforeEach(() => {
        thereIsNoGroup();
      });

      it('does not send any mail to the organizers', done => {
        groupIsOrganizedBy(groupId, [anyMemberWithEmail()]);

        mailsenderService.sendMailToContactPersonsOfGroup(groupId, message, (err, statusMessage) => {
          expect(err).to.exist();
          expectNoEmailWasSent();

          expect(statusMessage.contents().type).to.eql('alert-danger');
          expect(statusMessage.contents().additionalArguments.type).to.eql('$t(mailsender.notification)');
          expect(statusMessage.contents().additionalArguments.err).to.eql(`Error: 0 Gruppen für Id ${groupId} gefunden. Erwarte genau eine Gruppe.`);
          done();
        });
      });
    });

    describe('when contact organizers is enabled for group', () => {
      const group = new Group({id: groupId, contactTheOrganizers: true});

      beforeEach(() => {
        thereIsAGroup(group);
      });

      it('sends BCC to all organizers of given group', done => {
        groupIsOrganizedBy(groupId, [
          memberWithMailAdress('first@example.org'),
          memberWithMailAdress('second@example.org')
        ]);

        mailsenderService.sendMailToContactPersonsOfGroup(groupId, message, (err) => {
          expect(err).to.not.exist();
          const email = singleSentEmail();
          expect(email.bcc).to.contain('first@example.org');
          expect(email.bcc).to.contain('second@example.org');
          done();
        });

      });

      it('allows organizers to see the source of the mail by prepending a prefix to the subject', done => {
        groupIsOrganizedBy(groupId, [
          anyMemberWithEmail()
        ]);

        message.setSubject('Email-Subject');

        mailsenderService.sendMailToContactPersonsOfGroup(groupId, message, err => {
          expect(err).to.not.exist();
          const email = singleSentEmail();
          expect(email.subject).to.eql('[Anfrage an Ansprechpartner/Mail to organizers] Email-Subject');
          done();
        });
      });

      describe('organizers for group can not be read', () => {
        it('does not send any email', done => {
          loadingGroupOrganizersFailsFor(groupId);

          mailsenderService.sendMailToContactPersonsOfGroup(groupId, message, (err, statusMessage) => {
            expect(err).to.exist();

            expectNoEmailWasSent();
            expect(statusMessage.contents().type).to.eql('alert-danger');
            expect(statusMessage.contents().additionalArguments.type).to.eql('$t(mailsender.notification)');
            expect(statusMessage.contents().additionalArguments.err).to.eql('Error: no soup for you');
            done();
          });
        });
      });

      describe('in case of a group without any organizers', () => {
        it('does not send any email', function (done) {
          groupIsOrganizedBy(groupId, []);

          mailsenderService.sendMailToContactPersonsOfGroup(groupId, message, (err, statusMessage) => {
            expect(err).to.not.exist();
            expectNoEmailWasSent();
            expect(statusMessage.contents().type).to.eql('alert-danger');
            expect(statusMessage.contents().additionalArguments.err).to.eql('$t(mailsender.group_has_no_organizers)');
            expect(statusMessage.contents().additionalArguments.type).to.eql('$t(mailsender.notification)');
            done();
          });
        });
      });

      describe('status message', () => {
        describe('when message is successfully send', () => {
          it('returns a message indicating the success', (done) => {
            groupIsOrganizedBy(groupId, [anyMemberWithEmail()]);
            mailsenderService.sendMailToContactPersonsOfGroup(groupId, message, (err, statusmessage) => {
              expect(err).not.to.exist();
              expect(statusmessage.contents().type).to.eql('alert-success');
              done();
            });
          });
        });
      });
    });
  });
});
