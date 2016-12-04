'use strict';

const request = require('supertest');
const sinon = require('sinon').sandbox.create();

const beans = require('../../testutil/configureForTest').get('beans');

const memberstore = beans.get('memberstore');
const Member = beans.get('member');
const dummymember = new Member({id: 'memberID', nickname: 'hada', email: 'a@b.c', site: 'http://my.blog', firstname: 'Hans', lastname: 'Dampf', authentications: []});
const socratesmember = new Member({id: 'socID', nickname: 'soci', email: 'soc@ra.tes', site: '', firstname: 'Frank', lastname: 'Pink', socratesOnly: true, authentications: []});

const groupsService = beans.get('groupsService');
const membersService = beans.get('membersService');
const groupsAndMembersService = beans.get('groupsAndMembersService');
const Group = beans.get('group');

const activitiesService = beans.get('activitiesService');
const Activity = beans.get('activity');

const fieldHelpers = beans.get('fieldHelpers');
const createApp = require('../../testutil/testHelper')('administrationApp').createApp;

describe('Administration application', () => {
  const appWithSuperuser = request(createApp('superuserID'));

  const emptyActivity = new Activity({
    title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
    location: 'location1', direction: 'direction1', startUnix: fieldHelpers.parseToUnixUsingDefaultTimezone('01.01.2013'),
    url: 'urlOfTheActivity', owner: 'owner'
  });

  beforeEach(() => {
    sinon.stub(groupsService, 'getAllAvailableGroups', callback => callback(null, [new Group({id: 'id', longName: 'GRUPPO', description: 'desc'})]));
    sinon.stub(membersService, 'putAvatarIntoMemberAndSave', (member, callback) => {
      callback();
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('shows the table for members including socrates only members', done => {
    sinon.stub(memberstore, 'allMembers', callback => callback(null, [dummymember]));
    sinon.stub(memberstore, 'socratesOnlyMembers', callback => callback(null, [socratesmember]));
    appWithSuperuser
      .get('/memberTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Mitglieder/)
      .expect(/a@b\.c/)
      .expect(/img src="https:\/\/www.socrates-conference.de\/img\/favicon\.ico"/)
      .expect(/soc@ra\.tes/, done);
  });

  it('shows the table for members and groups', done => {
    sinon.stub(groupsAndMembersService, 'getAllMembersWithTheirGroups', callback => callback(null, [dummymember], [{group: 'Überflüssig', extraAddresses: ['peter.pan@alice.de']}]));
    appWithSuperuser
      .get('/memberAndGroupTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Mitglieder und Gruppen/)
      .expect(/Hans Dampf/)
      .expect(/<dt>Überflüssig<\/dt>/)
      .expect(/<dd>peter\.pan@alice\.de<\/dd>/)
      .expect(/GRUP&hellip;/, done);
  });

  it('shows the table for groups', done => {
    appWithSuperuser
      .get('/groupTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Gruppen/)
      .expect(/GRUPPO/, done);
  });

  it('shows the table for activities', done => {
    sinon.stub(activitiesService, 'getActivitiesForDisplay', (activitiesFetcher, callback) => callback(null, [emptyActivity]));
    appWithSuperuser
      .get('/activityTable')
      .expect(200)
      .expect(/<h2>Verwaltung<small> Aktivitäten /)
      .expect(/Title of the Activity/)
      .expect(/01\.01\.2013/, done);
  });
});
