'use strict';

const request = require('supertest');
const sinon = require('sinon').createSandbox();

const beans = require('../../testutil/configureForTest').get('beans');

const memberstore = beans.get('memberstore');
const Member = beans.get('member');
const dummymember = new Member({id: 'memberID', nickname: 'hada', email: 'a@b.c', site: 'http://my.blog', firstname: 'Hans', lastname: 'Dampf', authentications: []});

const groupsService = beans.get('groupsService');
const membersService = beans.get('membersService');
const Group = beans.get('group');

const activitiesService = beans.get('activitiesService');
const Activity = beans.get('activity');

const fieldHelpers = beans.get('fieldHelpers');
const createApp = require('../../testutil/testHelper')('administrationApp').createApp;

describe('Administration application', () => {
  /*eslint no-regex-spaces: 0 */

  const appWithSuperuser = request(createApp('superuserID'));

  const emptyActivity = new Activity({
    title: 'Title of the Activity', description: 'description1', assignedGroup: 'groupname',
    location: 'location1', direction: 'direction1', startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone('01.01.2013').toJSDate(),
    url: 'urlOfTheActivity', owner: 'owner'
  });

  beforeEach(() => {
    sinon.stub(groupsService, 'getAllAvailableGroups').callsFake(
      callback => callback(null, [new Group({id: 'id', longName: 'GRUPPO', description: 'desc'})])
    );
    sinon.stub(memberstore, 'allMembers').callsFake(callback => callback(null, [dummymember]));
    sinon.stub(membersService, 'putAvatarIntoMemberAndSave').callsFake((member, callback) => {
      callback();
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('shows the table for members', done => {
    appWithSuperuser
      .get('/memberTable')
      .expect(200)
      .expect(/<h2>Verwaltung  <small> Mitglieder/)
      .expect(/a@b\.c/, done);
  });

  it('shows the table for members and groups', done => {
    appWithSuperuser
      .get('/memberAndGroupTable')
      .expect(200)
      .expect(/<h2>Verwaltung  <small> Mitglieder und Gruppen/)
      .expect(/Hans Dampf/)
      .expect(/GRUP&hellip;/, done);
  });

  it('shows the table for groups', done => {
    appWithSuperuser
      .get('/groupTable')
      .expect(200)
      .expect(/<h2>Verwaltung  <small> Gruppen/)
      .expect(/GRUPPO/, done);
  });

  it('shows the table for activities', done => {
    sinon.stub(activitiesService, 'getActivitiesForDisplay').callsFake((activitiesFetcher, callback) => callback(null, [emptyActivity]));
    appWithSuperuser
      .get('/activityTable')
      .expect(200)
      .expect(/<h2>Verwaltung  <small> Aktivitäten /)
      .expect(/Title of the Activity/)
      .expect(/1\.1\.2013/, done);
  });
});
