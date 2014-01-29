"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var Activity = conf.get('beans').get('activity');
var Member = conf.get('beans').get('member');

var member1 = new Member({id: 'memberId1'});
var member2 = new Member({id: 'memberId2'});


// TODO Activity.fillFromUI with null/undefined in startDate, startTime, endDate, endTime

describe('Activity\'s participantsOf function', function () {
  it('returns an empty list if no participants are present', function () {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [ {memberId: 'memberId1'}]}}});
    expect(activity.participantsOf('Einzelzimmer').length).to.equal(0);
  });

  it('returns an empty list if the resource is not present', function () {
    var activity = new Activity();
    activity.participants = [member1];
    expect(activity.participantsOf('Einzelzimmer').length).to.equal(0);
  });

  it('returns a participant that is registered for the resource in question', function () {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [ {memberId: 'memberId1'}]}}});
    activity.participants = [member1];
    expect(activity.participantsOf('Einzelzimmer').length).to.equal(1);
    expect(activity.participantsOf('Einzelzimmer')[0].id()).to.equal('memberId1');
  });

  it('returns no participant if he is not registered for the resource in question', function () {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [ {memberId: 'memberId2'}]}}});
    activity.participants = [member1];
    expect(activity.participantsOf('Einzelzimmer').length).to.equal(0);
  });

  it('returns one participant if only one is registered for the resource in question', function () {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [ {memberId: 'memberId2'}]}}});
    activity.participants = [member1, member2];
    expect(activity.participantsOf('Einzelzimmer').length).to.equal(1);
    expect(activity.participantsOf('Einzelzimmer')[0].id()).to.equal('memberId2');
  });

  it('returns one participant if only one is participant of the activity', function () {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [ {memberId: 'memberId2'}, {memberId: 'memberId1'}]}}});
    activity.participants = [member2];
    expect(activity.participantsOf('Einzelzimmer').length).to.equal(1);
    expect(activity.participantsOf('Einzelzimmer')[0].id()).to.equal('memberId2');
  });

  it('returns two participants if both are registered for the resource in question', function () {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [ {memberId: 'memberId2'}, {memberId: 'memberId1'}]}}});
    activity.participants = [member1, member2];
    expect(activity.participantsOf('Einzelzimmer').length).to.equal(2);
    expect(activity.participantsOf('Einzelzimmer')[0].id()).to.equal('memberId1');
    expect(activity.participantsOf('Einzelzimmer')[1].id()).to.equal('memberId2');
  });

});
