'use strict';

const expect = require('must-dist');
const sinon = require('sinon').sandbox.create();
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
      startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
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
        expect(sendmail.calledOnce).to.be(true);
        const transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain(email);
        expect(transportobject.html).to.contain('mark down');
        expect(transportobject.icalEvent).to.contain('BEGIN:VCALENDAR');
        expect(transportobject.icalEvent).to.contain('URL:http://localhost:17125/activities/urlOfTheActivity');
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
        expect(sendmail.calledOnce).to.be(true);
        const transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('email@mail.de');
        expect(transportobject.html).to.contain('mark down');
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
        expect(sendmail.calledOnce).to.be(true);
        const transportobject = sendmail.args[0][0];
        expect(transportobject.from).to.contain('first last');
        expect(transportobject.subject).to.contain('Austrittswunsch');
        expect(transportobject.to).to.contain('email@super.user');
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
        expect(sendmail.calledOnce).to.be(true);
        const transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('memberA');
        expect(transportobject.bcc).to.contain('memberB');
        expect(transportobject.html).to.contain('mark down');
        expect(transportobject.icalEvent).to.contain('BEGIN:VCALENDAR');
        expect(transportobject.icalEvent).to.contain('URL:http://localhost:17125/activities/urlOfTheActivity');
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
        expect(sendmail.calledOnce).to.be(true);
        const transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('memberA');
        expect(transportobject.bcc).to.contain('memberB');
        expect(transportobject.html).to.contain('mark down');
        expect(transportobject.icalEvent).to.be(undefined);
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

});


