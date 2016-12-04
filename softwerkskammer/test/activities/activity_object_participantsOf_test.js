'use strict';

const expect = require('must-dist');

const beans = require('../../testutil/configureForTest').get('beans');
const Activity = beans.get('activity');
const Member = beans.get('member');

const member1 = new Member({id: 'memberId1'});
const member2 = new Member({id: 'memberId2'});

// TODO Activity.fillFromUI with null/undefined in startDate, startTime, endDate, endTime

describe('Activity\'s participantsOf function', () => {
  it('returns an empty list if no participants are present', () => {
    const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId1'}]}}});
    expect(activity.participantsOf('Veranstaltung')).to.have.length(0);
  });

  it('returns an empty list if the resource is not present', () => {
    const activity = new Activity();
    activity.participants = [member1];
    expect(activity.participantsOf('Veranstaltung')).to.have.length(0);
  });

  it('returns a participant that is registered for the resource in question', () => {
    const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId1'}]}}});
    activity.participants = [member1];
    expect(activity.participantsOf('Veranstaltung')).to.have.length(1);
    expect(activity.participantsOf('Veranstaltung')[0].id()).to.equal('memberId1');
  });

  it('returns no participant if he is not registered for the resource in question', () => {
    const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId2'}]}}});
    activity.participants = [member1];
    expect(activity.participantsOf('Veranstaltung')).to.have.length(0);
  });

  it('returns one participant if only one is registered for the resource in question', () => {
    const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId2'}]}}});
    activity.participants = [member1, member2];
    expect(activity.participantsOf('Veranstaltung')).to.have.length(1);
    expect(activity.participantsOf('Veranstaltung')[0].id()).to.equal('memberId2');
  });

  it('returns one participant if only one is participant of the activity', () => {
    const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId2'}, {memberId: 'memberId1'}]}}});
    activity.participants = [member2];
    expect(activity.participantsOf('Veranstaltung')).to.have.length(1);
    expect(activity.participantsOf('Veranstaltung')[0].id()).to.equal('memberId2');
  });

  it('returns two participants if both are registered for the resource in question', () => {
    const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId2'}, {memberId: 'memberId1'}]}}});
    activity.participants = [member1, member2];
    expect(activity.participantsOf('Veranstaltung')).to.have.length(2);
    expect(activity.participantsOf('Veranstaltung')[0].id()).to.equal('memberId1');
    expect(activity.participantsOf('Veranstaltung')[1].id()).to.equal('memberId2');
  });

});
