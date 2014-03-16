"use strict";

var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();
var beans = require('../../testutil/configureForTest').get('beans');

var membersAPI = beans.get('membersAPI');
var groupsAPI = beans.get('groupsAPI');
var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var activitiesAPI = beans.get('activitiesAPI');

var api = beans.get('mailsenderAPI');
var Activity = beans.get('activity');
var Member = beans.get('member');
var Message = beans.get('message');
var Group = beans.get('group');
var fieldHelpers = beans.get('fieldHelpers');
var mailtransport = beans.get('mailtransport');

var emptyActivity;

var sender = new Member();
var message = new Message({subject: 'subject', markdown: 'mark down'}, sender);
var sendmail;

describe('MailsenderAPI', function () {
  var activityURL = 'acti_vi_ty';
  var nickname = 'nickyNamy';

  beforeEach(function () {
    var availableGroups = [];
    emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'assignedGroup',
      location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlOfTheActivity' });
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, availableGroups); });
    sinon.stub(activitiesAPI, 'getActivityWithGroupAndParticipants', function (activityURL, callback) {
      if (activityURL === null) { return callback(new Error()); }
      callback(null, emptyActivity);
    });
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) {
      if (nickname === null) { return callback(null); }
      if (nickname === 'broken') { return callback(new Error()); }
      callback(null, new Member({email: 'email@mail.de'}));
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
      api.dataForShowingMessageForActivity(activityURL, 'de', function (err, result) {
        expect(result.message).to.exist;
        expect(result.regionalgroups).to.exist;
        expect(result.themegroups).to.exist;
        expect(result.successURL).to.contain(activityURL);
        done(err);
      });
    });

    it('for showing the edit form for a member', function (done) {
      api.dataForShowingMessageToMember(nickname, function (err, result) {
        expect(result.message).to.exist;
        expect(result.regionalgroups).to.not.exist;
        expect(result.themegroups).to.not.exist;
        expect(result.successURL).to.contain(nickname);
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
      var markdown = api.activityMarkdown(activity);
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
      expect(api.activityMarkdown(activity)).to.not.contain('Wegbeschreibung');
    });
  });

  describe('sending mail as reminder for activity', function () {
    it('sends to participants', function (done) {
      var emailAddress = 'emailAddress@e.mail';
      emptyActivity.participants = [new Member({email: emailAddress})];

      api.sendMailToParticipantsOf(activityURL, message, function (statusmessage) {
        expect(sendmail.calledOnce).to.be.ok;
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain(emailAddress);
        expect(transportobject.html).to.contain('mark down');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done();
      });
    });

    it('does not send mail if no participants', function (done) {
      api.sendMailToParticipantsOf(activityURL, message, function (statusmessage) {
        expect(sendmail.calledOnce).to.be.ok;
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send mail if activity canot be found', function (done) {
      api.sendMailToParticipantsOf(null, message, function (statusmessage) {
        expect(sendmail.calledOnce).to.not.be.ok;
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending mail to distinct member', function () {
    it('sends the email', function (done) {
      api.sendMailToMember('nickname', message, function (statusmessage) {
        expect(sendmail.calledOnce).to.be.ok;
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('email@mail.de');
        expect(transportobject.html).to.contain('mark down');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done();
      });
    });

    it('does not send the email if member cannot be found', function (done) {
      api.sendMailToMember(null, message, function (statusmessage) {
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send the email if finding member causes error', function (done) {
      api.sendMailToMember('broken', message, function (statusmessage) {
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending resignment mail', function () {
    var superuser = new Member({id: 'superuserID', email: 'email@super.user'});

    beforeEach(function () {
      sinon.stub(membersAPI, 'allMembers', function (callback) { callback(null, [superuser]); });
    });

    it('sends the email', function (done) {
      var markdown = '';
      var member = new Member({nickname: 'nick', firstname: 'first', lastname: 'last'});
      api.sendResignment(markdown, member, function (statusmessage) {
        expect(sendmail.calledOnce).to.be.ok;
        var transportobject = sendmail.args[0][0];
        expect(transportobject.from).to.contain('first last');
        expect(transportobject.subject).to.contain('Austrittswunsch');
        expect(transportobject.to).to.contain('email@super.user');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done();
      });
    });

    it('does not send the email if member cannot be found', function (done) {
      api.sendMailToMember(null, message, function (statusmessage) {
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send the email if finding member causes error', function (done) {
      api.sendMailToMember('broken', message, function (statusmessage) {
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });
  });

  describe('sending mail as invitation for activity ', function () {
    var groupA = new Group({id: 'groupA'});
    var groupB = new Group({id: 'groupB'});

    beforeEach(function () {
      sinon.stub(groupsAPI, 'getGroups', function (groupnames, callback) {
        if (groupnames === null) { return callback(new Error()); }
        if (groupnames.length === 0) { return callback(null, []); }
        callback(null, [groupA, groupB]);
      });
    });

    it('sends to members of selected groups', function (done) {
      sinon.stub(groupsAndMembersAPI, 'addMembersToGroup', function (group, callback) {
        if (group === null) { return callback(null); }
        if (group === groupA) { group.members = [new Member({email: 'memberA'})]; }
        if (group === groupB) { group.members = [new Member({email: 'memberB'})]; }
        group.membercount = 1;
        callback(null, group);
      });
      api.sendMailToInvitedGroups(['GroupA', 'GroupB'], message, function (statusmessage) {
        expect(sendmail.calledOnce).to.be.ok;
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('memberA');
        expect(transportobject.bcc).to.contain('memberB');
        expect(transportobject.html).to.contain('mark down');
        expect(statusmessage.contents().type).to.equal('alert-success');
        done();
      });
    });

    it('does not send to members if no groups selected', function (done) {
      api.sendMailToInvitedGroups([], message, function (statusmessage) {
        expect(sendmail.calledOnce).to.not.be.ok;
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send to members if finding groups causes error', function (done) {
      api.sendMailToInvitedGroups(null, message, function (statusmessage) {
        expect(sendmail.calledOnce).to.not.be.ok;
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

    it('does not send to members if filling groups with members causes error', function (done) {
      sinon.stub(groupsAndMembersAPI, 'addMembersToGroup', function (group, callback) {
        callback(new Error());
      });

      api.sendMailToInvitedGroups(['GroupA', 'GroupB'], message, function (statusmessage) {
        expect(sendmail.calledOnce).to.not.be.ok;
        expect(statusmessage.contents().type).to.equal('alert-danger');
        done();
      });
    });

  });

});


