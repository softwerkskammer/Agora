"use strict";

var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();
var beans = require('../configureForTest').get('beans');

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

var emptyActivity = new Activity({title: 'Title of the Activity', description: 'description1', assignedGroup: 'assignedGroup',
  location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'), url: 'urlOfTheActivity' });

describe('MailsenderAPI', function () {
  var activityURL = 'acti_vi_ty';
  var nickname = 'nickyNamy';

  beforeEach(function (done) {
    var availableGroups = [];
    sinon.stub(groupsAPI, 'getAllAvailableGroups', function (callback) { callback(null, availableGroups); });
    sinon.stub(activitiesAPI, 'getActivityWithGroupAndParticipants', function (activityURL, callback) {
      callback(null, emptyActivity);
    });
    sinon.stub(membersAPI, 'getMember', function (nickname, callback) { callback(null, new Member()); });
    done();
  });

  afterEach(function (done) {
    sinon.restore();
    done();
  });

  describe('preparing data', function () {
    it('for showing the edit form for an activity', function (done) {
      api.dataForShowingMessageForActivity(activityURL, 'de', function (err, result) {
        expect(result.message).to.exist;
        expect(result.regionalgroups).to.exist;
        expect(result.themegroups).to.exist;
        expect(result.successURL).to.contain(activityURL);
        done();
      });
    });

    it('for showing the edit form for a member', function (done) {
      api.dataForShowingMessageToMember(nickname, function (err, result) {
        expect(result.message).to.exist;
        expect(result.regionalgroups).to.not.exist;
        expect(result.themegroups).to.not.exist;
        expect(result.successURL).to.contain(nickname);
        done();
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

  describe('sending mail', function () {
    var groupA = new Group({id: 'groupA'});
    var groupB = new Group({id: 'groupB'});
    var sender = new Member();

    var sendmail;
    beforeEach(function () {
      sendmail = sinon.stub(mailtransport, 'sendMail', function (transportobject, callback) {
        if (!transportobject.bcc || transportobject.bcc.length === 0) {
          // simulating the behaviour of nodemailer
          return callback(new Error());
        }
        callback(null);
      });

      sinon.stub(groupsAPI, 'getGroups', function (groupnames, callback) { callback(null, [groupA, groupB]); });
      sinon.stub(groupsAndMembersAPI, 'addMembersToGroup', function (group, callback) {
        if (group === groupA) { group.members = [new Member({email: 'memberA'})]; }
        if (group === groupB) { group.members = [new Member({email: 'memberB'})]; }
        group.membercount = 1;
        callback(null, group);
      });

    });

    afterEach(function () {
      sinon.restore();
    });

    it('as reminder for activity sends to vistors of activity', function (done) {
      var emailAddress = 'emailAddress@e.mail';
      var message = new Message({subject: 'subject', markdown: 'mark down'}, sender);
      emptyActivity.visitors = [new Member({email: emailAddress})];

      api.sendMailToParticipantsOf(activityURL, message, function (err) {
        expect(sendmail.calledOnce).to.be.ok;
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain(emailAddress);
        expect(transportobject.html).to.contain('mark down');
        done(err);
      });
    });

    it('as reminder for activity does not send mail if no visitors', function (done) {
      var message = new Message({subject: 'subject', markdown: 'mark down'}, sender);
      emptyActivity.visitors = [];

      api.sendMailToParticipantsOf(activityURL, message, function (err) {
        expect(err).to.exist;
        done();
      });
    });

    it('as invitation for activity sends to members of selected groups', function (done) {
      var message = new Message({subject: 'subject', markdown: 'mark down'}, sender);

      api.sendMailToInvitedGroups(['GroupA', 'GroupB'], message, function (err) {
        expect(sendmail.calledOnce).to.be.ok;
        var transportobject = sendmail.args[0][0];
        expect(transportobject.bcc).to.contain('memberA');
        expect(transportobject.bcc).to.contain('memberB');
        expect(transportobject.html).to.contain('mark down');
        done(err);
      });
    });

  });

});


