'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();
var beans = require('../../testutil/configureForTest').get('beans');

var memberstore = beans.get('memberstore');
var groupsService = beans.get('groupsService');
var groupsAndMembersService = beans.get('groupsAndMembersService');
var activitiesService = beans.get('activitiesService');
var activitystore = beans.get('activitystore');

var mailsenderService = beans.get('mailsenderService');
var Activity = beans.get('activity');
var Member = beans.get('member');
var Message = beans.get('message');
var Group = beans.get('group');
var fieldHelpers = beans.get('fieldHelpers');
var mailtransport = beans.get('mailtransport').transport;

var emptyActivity;

var sender = new Member();
var message;
var sendmail;

describe('MailsenderService', function () {
  var activityURL = 'acti_vi_ty';
  var nickname = 'nickyNamy';

  beforeEach(function () {
    var availableGroups = [];
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
    sinon.stub(groupsService, 'getAllAvailableGroups', function (callback) { callback(null, availableGroups); });
    sinon.stub(activitiesService, 'getActivityWithGroupAndParticipants', function (actURL, callback) {
      if (actURL === null) { return callback(new Error()); }
      callback(null, emptyActivity);
    });
    sinon.stub(memberstore, 'getMember', function (nick, callback) {
      if (nick === null) { return callback(null); }
      if (nick === 'broken') { return callback(new Error()); }
      callback(null, new Member({email: 'email@mail.de'}));
    });
    sinon.stub(activitystore, 'getActivity', function (url, callback) {
      if (url === 'activityUrlForMock') { return callback(null, emptyActivity); }
      callback(new Error());
    });
    sendmail = sinon.stub(mailtransport, 'sendMail', function (transportobject, callback) {
      if (!transportobject.to && (!transportobject.bcc || transportobject.bcc.length === 0)) {
        // simulating the behaviour of nodemailer
        return callback(new Error());
      }
      callback(null);
    });
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('preparing data', function () {
    it('for showing the edit form for an activity', function (done) {
      mailsenderService.dataForShowingMessageForActivity(activityURL, 'de', function (err, result) {
        expect(result.message).to.exist();
        expect(result.regionalgroups).to.exist();
        expect(result.themegroups).to.exist();
        expect(result.successURL).to.contain(activityURL);
        done(err);
      });
    });

    it('URIescapes the url for an activity', function (done) {
      var url = 'some%20thing';
      var encodedURL = encodeURIComponent(url);
      mailsenderService.dataForShowingMessageForActivity(url, 'de', function (err, result) {
        expect(result.successURL).to.contain(encodedURL);
        done(err);
      });
    });

    it('for showing the edit form for a member', function (done) {
      mailsenderService.dataForShowingMessageToMember(nickname, function (err, result) {
        expect(result.message).to.exist();
        expect(result.regionalgroups).not.to.exist();
        expect(result.themegroups).not.to.exist();
        expect(result.successURL).to.contain(nickname);
        done(err);
      });
    });

    it('URIescapes the nickname for a member', function (done) {
      var nick = 'some%20thing';
      var encodedNick = encodeURIComponent(nick);
      mailsenderService.dataForShowingMessageToMember(nick, function (err, result) {
        expect(result.successURL).to.contain(encodedNick);
        done(err);
      });
    });
  });

  describe('activity markdown', function () {
    it('with direction', function () {
      var activity = new Activity().fillFromUI({
                                                 url: 'url',
                                                 description: 'description',
                                                 location: 'location',
                                                 direction: 'direction',
                                                 startDate: '4.5.2013',
                                                 startTime: '12:21'
                                               });
      var markdown = mailsenderService.activityMarkdown(activity);
      expect(markdown).to.contain('description');
      expect(markdown).to.contain('4. Mai 2013');
      expect(markdown).to.contain('12:21');
      expect(markdown).to.contain('location');
      expect(markdown).to.contain('Wegbeschreibung');
      expect(markdown).to.contain('direction');
    });

    it('without direction', function () {
      var activity = new Activity({
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

  describe('sending mail as reminder for activity', function () {
    it('sends to participants', function (done) {
      var emailAddress = 'emailAddress@e.mail';
      emptyActivity.participants = [new Member({email: emailAddress})];

      mailsenderService.sendMailToParticipantsOf(activityURL, message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.be(true);
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain(emailAddress);
        expect(transportobject.html).to.contain('mark down');
        expect(transportobject.icalEvent).to.contain('BEGIN:VCALENDAR');
        expect(transportobject.icalEvent).to.contain('URL:http://localhost:17125/activities/urlOfTheActivity');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('does not send mail if no participants', function (done) {
      mailsenderService.sendMailToParticipantsOf(activityURL, message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.be(true);
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done(err);
      });
    });

    it('does not send mail if activity canot be found', function (done) {
      mailsenderService.sendMailToParticipantsOf(null, message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.not.be(true);
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending mail to distinct member', function () {
    it('sends the email', function (done) {
      mailsenderService.sendMailToMember('nickname', message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.be(true);
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('email@mail.de');
        expect(transportobject.html).to.contain('mark down');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('does not send the email if member cannot be found', function (done) {
      mailsenderService.sendMailToMember(null, message, function (err, statusmessage) {
        expect(err).not.to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send the email if finding member causes error', function (done) {
      mailsenderService.sendMailToMember('broken', message, function (err, statusmessage) {
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending resignment mail', function () {
    var superuser = new Member({id: 'superuserID', email: 'email@super.user'});

    beforeEach(function () {
      sinon.stub(memberstore, 'superUsers', function (callback) { callback(null, [superuser]); });
    });

    it('sends the email', function (done) {
      var markdown = '';
      var member = new Member({nickname: 'nick', firstname: 'first', lastname: 'last'});
      mailsenderService.sendResignment(markdown, member, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.be(true);
        var transportobject = sendmail.args[0][0];
        expect(transportobject.from).to.contain('first last');
        expect(transportobject.subject).to.contain('Austrittswunsch');
        expect(transportobject.to).to.contain('email@super.user');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('does not send the email if member cannot be found', function (done) {
      mailsenderService.sendMailToMember(null, message, function (err, statusmessage) {
        expect(err).not.to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send the email if finding member causes error', function (done) {
      mailsenderService.sendMailToMember('broken', message, function (err, statusmessage) {
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending mail as invitation for activity ', function () {
    var groupA = new Group({id: 'groupA'});
    var groupB = new Group({id: 'groupB'});

    beforeEach(function () {
      sinon.stub(groupsService, 'getGroups', function (groupnames, callback) {
        if (groupnames === null) { return callback(new Error()); }
        if (groupnames.length === 0) { return callback(null, []); }
        callback(null, [groupA, groupB]);
      });
    });

    it('sends to members of selected groups', function (done) {
      sinon.stub(groupsAndMembersService, 'addMembersToGroup', function (group, callback) {
        if (group === null) { return callback(null); }
        if (group === groupA) { group.members = [new Member({email: 'memberA'})]; }
        if (group === groupB) { group.members = [new Member({email: 'memberB'})]; }
        group.membercount = 1;
        callback(null, group);
      });
      mailsenderService.sendMailToInvitedGroups(['GroupA', 'GroupB'], 'activityUrlForMock', message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.be(true);
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('memberA');
        expect(transportobject.bcc).to.contain('memberB');
        expect(transportobject.html).to.contain('mark down');
        expect(transportobject.icalEvent).to.contain('BEGIN:VCALENDAR');
        expect(transportobject.icalEvent).to.contain('URL:http://localhost:17125/activities/urlOfTheActivity');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('ignores errors finding the activity when sending to members of selected groups', function (done) {
      sinon.stub(groupsAndMembersService, 'addMembersToGroup', function (group, callback) {
        if (group === null) { return callback(null); }
        if (group === groupA) { group.members = [new Member({email: 'memberA'})]; }
        if (group === groupB) { group.members = [new Member({email: 'memberB'})]; }
        group.membercount = 1;
        callback(null, group);
      });
      mailsenderService.sendMailToInvitedGroups(['GroupA', 'GroupB'], 'errorProvokingUrl', message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.be(true);
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('memberA');
        expect(transportobject.bcc).to.contain('memberB');
        expect(transportobject.html).to.contain('mark down');
        expect(transportobject.icalEvent).to.be(undefined);
        expect(statusmessage.contents().type).to.equal('alert-success');
        done(err);
      });
    });

    it('does not send to members if no groups selected', function (done) {
      mailsenderService.sendMailToInvitedGroups([], 'activityUrlForMock', message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.not.be(true);
        expect(err).not.to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send to members if finding groups causes error', function (done) {
      mailsenderService.sendMailToInvitedGroups(null, 'activityUrlForMock', message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.not.be(true);
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send to members if filling groups with members causes error', function (done) {
      sinon.stub(groupsAndMembersService, 'addMembersToGroup', function (group, callback) {
        callback(new Error());
      });

      mailsenderService.sendMailToInvitedGroups(['GroupA', 'GroupB'], 'activityUrlForMock', message, function (err, statusmessage) {
        expect(sendmail.calledOnce).to.not.be(true);
        expect(err).to.exist();
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

  });

});


