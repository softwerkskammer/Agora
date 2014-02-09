"use strict";

var sinon = require('sinon').sandbox.create();
var expect = require('chai').expect;

var beans = require('../configureForTest').get('beans');

var groupsAndMembersAPI = beans.get('groupsAndMembersAPI');
var membersAPI = beans.get('membersAPI');

var Activity = beans.get('activity');
var Member = beans.get('member');
var Group = beans.get('group');
var notifications = beans.get('notifications');
var transport = beans.get('mailtransport');

var activity;
var group;
var hans = new Member({id: 'hans', firstname: 'firstname of hans', lastname: 'lastname of hans', email: 'hans@email.de'});
var alice = new Member({id: 'alice', firstname: 'firstname of alice', lastname: 'lastname of alice', email: 'alice@email.de'});
var bob = new Member({id: 'bob', firstname: 'firstname of bob', lastname: 'lastname of bob', email: 'bob@email.de', nickname: 'nickbob'});

describe('Notifications', function () {

  beforeEach(function () {
    group = new Group({id: 'groupname', longName: 'Buxtehude'});
    activity = new Activity({title: 'Title of the Activity', assignedGroup: 'groupname'});
    sinon.stub(groupsAndMembersAPI, 'getGroupAndMembersForList', function (groupID, callback) { callback(null, group); });
    sinon.stub(membersAPI, 'getMemberForId', function (memberID, callback) {
      if (memberID === 'hans') { return callback(null, hans); }
      if (memberID === 'alice') { return callback(null, alice); }
      if (memberID === 'bob') { return callback(null, bob); }
      callback(null);
    });
    sinon.stub(transport, 'sendMail');
  });

  afterEach(function () {
    sinon.restore();
  });

  it('triggers mail sending for group organizers and activity owner', function () {
    activity.state.owner = 'hans';
    group.organizers = ['alice'];
    group.members = [hans, alice, bob];

    notifications.visitorRegistration(activity, 'bob', 'Kaffeekranz');
    expect(transport.sendMail.calledOnce).to.be.true;
    var options = transport.sendMail.firstCall.args[0];
    expect(options.from).to.contain('notifier@softwerkskammer.org');
    expect(options.bcc).to.contain('hans@email.de');
    expect(options.bcc).to.contain('alice@email.de');
    expect(options.bcc).to.not.contain('bob');
    expect(options.subject).to.equal('Visitor Registration');
    expect(options.text).to.contain('The activity \"Title of the Activity\" (Kaffeekranz)');
    expect(options.text).to.contain('new visitor:\n\nfirstname of bob lastname of bob');
    expect(options.text).to.contain('/members/nickbob');
  });

  it('triggers mail sending for only group organizers if activity has no owner', function () {
    group.organizers = ['alice'];
    group.members = [hans, alice, bob];

    notifications.visitorRegistration(activity, 'bob', 'Kaffeekranz');
    expect(transport.sendMail.calledOnce).to.be.true;
    var options = transport.sendMail.firstCall.args[0];
    expect(options.from).to.contain('notifier@softwerkskammer.org');
    expect(options.bcc).to.equal('alice@email.de');
    expect(options.subject).to.equal('Visitor Registration');
    expect(options.text).to.contain('The activity \"Title of the Activity\" (Kaffeekranz)');
    expect(options.text).to.contain('new visitor:\n\nfirstname of bob lastname of bob');
    expect(options.text).to.contain('/members/nickbob');
  });

  it('triggers no mail sending if activity has no owner and no group organizers', function () {
    group.members = [hans, alice, bob];

    notifications.visitorRegistration(activity, 'bob', 'Kaffeekranz');
    expect(transport.sendMail.called).to.be.false;
  });

});
