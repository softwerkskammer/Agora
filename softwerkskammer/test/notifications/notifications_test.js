'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must-dist');

var beans = require('../../testutil/configureForTest').get('beans');

var groupsAndMembersService = beans.get('groupsAndMembersService');
var memberstore = beans.get('memberstore');

var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');
var notifications = beans.get('notifications');
var transport = beans.get('mailtransport');

var activity;
var activity2;
var group;
var hans = new Member({
  id: 'hans',
  firstname: 'firstname of hans',
  lastname: 'lastname of hans',
  email: 'hans@email.de'
});
var alice = new Member({
  id: 'alice',
  firstname: 'firstname of alice',
  lastname: 'lastname of alice',
  email: 'alice@email.de'
});
var bob = new Member({
  id: 'bob',
  firstname: 'firstname of bob',
  lastname: 'lastname of bob',
  email: 'bob@email.de',
  nickname: 'nickbob'
});

describe('Notifications', function () {

  beforeEach(function () {
    group = new Group({id: 'groupname', longName: 'Buxtehude'});
    activity = new Activity({title: 'Title of the Activity', assignedGroup: 'groupname', url: 'urlurl'});
    activity2 = new Activity({title: 'Another Nice Activity', assignedGroup: 'groupname', url: 'niceurl'});
    sinon.stub(groupsAndMembersService, 'getGroupAndMembersForList', function (groupID, callback) { callback(null, group); });
    sinon.stub(memberstore, 'getMemberForId', function (memberID, callback) {
      if (memberID === 'hans') { return callback(null, hans); }
      if (memberID === 'alice') { return callback(null, alice); }
      if (memberID === 'bob') { return callback(null, bob); }
      callback(null);
    });
    sinon.stub(transport, 'sendMail', function (opts, callback) { return callback(); });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('creates a meaningful text and subject', function (done) {
    activity.state.owner = 'hans';

    notifications.visitorRegistration(activity, 'bob', 'Kaffeekranz', function (err) {
      expect(transport.sendMail.calledOnce).to.be(true);
      var options = transport.sendMail.firstCall.args[0];
      expect(options.subject).to.equal('Neue Anmeldung für Aktivität');
      expect(options.html).to.contain('Für die Aktivität "Title of the Activity" (Kaffeekranz) hat sich ein neuer Besucher angemeldet:');
      expect(options.html).to.contain('firstname of bob lastname of bob (nickbob)');
      expect(options.html).to.contain('/activities/urlurl');
      done(err);
    });
  });

  it('creates a meaningful text and subject on each invocation when invoked twice', function (done) {
    activity.state.owner = 'hans';
    activity2.state.owner = 'hans';

    notifications.visitorRegistration(activity, 'bob', 'Kaffeekranz', function (err) {
      if (err) { return done(err); }
      notifications.visitorRegistration(activity2, 'alice', 'Biertrinken', function (err1) {

        expect(transport.sendMail.calledTwice).to.be(true);
        var options = transport.sendMail.firstCall.args[0];
        expect(options.subject).to.equal('Neue Anmeldung für Aktivität');
        expect(options.html).to.contain('Für die Aktivität "Title of the Activity" (Kaffeekranz) hat sich ein neuer Besucher angemeldet:');
        expect(options.html).to.contain('firstname of bob lastname of bob (nickbob)');
        expect(options.html).to.contain('/activities/urlurl');

        options = transport.sendMail.secondCall.args[0];
        expect(options.subject).to.equal('Neue Anmeldung für Aktivität');
        expect(options.html).to.contain('Für die Aktivität "Another Nice Activity" (Biertrinken) hat sich ein neuer Besucher angemeldet:');
        expect(options.html).to.contain('firstname of alice lastname of alice ()');
        expect(options.html).to.contain('/activities/niceurl');
        done(err1);
      });
    });
  });

  it('triggers mail sending for group organizers and activity owner', function (done) {
    activity.state.owner = 'hans';
    group.organizers = ['alice'];
    group.members = [hans, alice, bob];

    notifications.visitorRegistration(activity, 'bob', 'Kaffeekranz', function (err) {
      expect(transport.sendMail.calledOnce).to.be(true);
      var options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.contain('hans@email.de');
      expect(options.bcc).to.contain('alice@email.de');
      expect(options.bcc).to.not.contain('bob');
      expect(options.from).to.contain('Softwerkskammer Benachrichtigungen');
      done(err);
    });
  });

  it('triggers mail sending for only group organizers if activity has no owner', function () {
    group.organizers = ['alice'];
    group.members = [hans, alice, bob];

    notifications.visitorRegistration(activity, 'bob', 'Kaffeekranz');
    expect(transport.sendMail.calledOnce).to.be(true);
    var options = transport.sendMail.firstCall.args[0];
    expect(options.bcc).to.equal('alice@email.de');
    expect(options.bcc).to.not.contain('bob');
    expect(options.bcc).to.not.contain('hans');
  });

  it('does not trigger mail sending if activity has no owner and no group organizers', function () {
    group.members = [hans, alice, bob];

    notifications.visitorRegistration(activity, 'bob', 'Kaffeekranz');
    expect(transport.sendMail.called).to.be(false);
  });

});
