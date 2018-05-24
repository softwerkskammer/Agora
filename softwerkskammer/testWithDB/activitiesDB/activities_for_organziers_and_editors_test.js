'use strict';

const moment = require('moment-timezone');

const sinon = require('sinon').createSandbox();
const expect = require('must-dist');

const beans = require('../../testutil/configureForTestWithDB').get('beans');
const activitystore = beans.get('activitystore');
const persistence = beans.get('activitiesPersistence');
const Activity = beans.get('activity');

describe('Activity application with DB - shows activities where a member is organizer or editor -', () => {

  const tomorrowEarly = moment().add(1, 'days');
  const tomorrowLate = moment().add(1, 'days').add(1, 'hours');
  const dayAfterTomorrow = moment().add(2, 'days');
  const yesterday = moment().subtract(1, 'days');
  const dayBeforeYesterday = moment().subtract(2, 'days');

  const futureActivityOwner1NoEditorIds = new Activity({
    id: 'futureActivity1', title: 'Future Activity 1', description: 'description1', assignedGroup: 'groupname1',
    location: 'location1', direction: 'direction1', startUnix: tomorrowEarly.unix(), endUnix: dayAfterTomorrow.unix(),
    url: 'url_future', owner: 'owner1', resources: {
      Veranstaltung: {_registeredMembers: [{memberId: 'memberId2'}], _registrationOpen: true},
      AndereVeranstaltung: {_registeredMembers: [{memberId: 'memberId2'}], _registrationOpen: true}
    }, version: 1
  });

  const futureActivityOwner2EmptyEditorIds = new Activity({
    id: 'futureActivity2',
    title: 'Future Activity 2',
    description: 'description1',
    assignedGroup: 'groupname2',
    location: 'location1',
    direction: 'direction1',
    startUnix: tomorrowLate.unix(),
    endUnix: dayAfterTomorrow.unix(),
    url: 'url_future',
    owner: 'owner2',
    editorIds: [],
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  const currentActivityOwner2EditorOwner1 = new Activity({
    id: 'currentActivity1',
    title: 'Current Activity 1',
    description: 'description1',
    assignedGroup: 'groupname1',
    location: 'location1',
    direction: 'direction1',
    startUnix: yesterday.unix(),
    endUnix: tomorrowEarly.unix(),
    url: 'url_current',
    owner: 'owner2',
    editorIds: ['owner1', 'otherperson', 'yetanother'],
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  const pastActivityOwner3EditorOwner3 = new Activity({
    id: 'pastActivity1',
    title: 'Past Activity 1',
    description: 'description1',
    assignedGroup: 'groupname',
    location: 'location1',
    direction: 'direction1',
    startUnix: dayBeforeYesterday.unix(),
    endUnix: yesterday.unix(),
    url: 'url_past',
    owner: 'owner3',
    editorIds: ['owner3'],
    resources: {Veranstaltung: {_registeredMembers: [{memberId: 'memberId'}], _registrationOpen: true}},
    version: 1
  });

  beforeEach(done => { // if this fails, you need to start your mongo DB

    persistence.drop(() => {
      activitystore.saveActivity(futureActivityOwner1NoEditorIds, err => {
        if (err) { done(err); }
        activitystore.saveActivity(futureActivityOwner2EmptyEditorIds, err1 => {
          if (err1) { done(err1); }
          activitystore.saveActivity(currentActivityOwner2EditorOwner1, err2 => {
            if (err2) { done(err2); }
            activitystore.saveActivity(pastActivityOwner3EditorOwner3, err3 => {
              done(err3);
            });
          });
        });
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('no activities for members who are neither owners nor editors', done => {

    activitystore.organizedOrEditedActivitiesForMemberId('no-owner-and-no-editor', (err, activities) => {
      expect(activities.length).to.equal(0);
      done(err);
    });
  });

  it('shows activities where owner1 is owner or editor, oldest last', done => {

    activitystore.organizedOrEditedActivitiesForMemberId('owner1', (err, activities) => {
      expect(activities.length).to.equal(2);
      expect(activities[0].title()).to.equal('Future Activity 1');
      expect(activities[1].title()).to.equal('Current Activity 1');
      done(err);
    });
  });

  it('if a person is owner and editor, the activity only appears once', done => {

    activitystore.organizedOrEditedActivitiesForMemberId('owner3', (err, activities) => {
      expect(activities.length).to.equal(1);
      expect(activities[0].title()).to.equal('Past Activity 1');
      done(err);
    });
  });
});

describe('Activity application with DB - organizedOrEditedActivitiesForMemberId without activities -', () => {

  beforeEach(done => { // if this fails, you need to start your mongo DB
    persistence.drop(done);
  });

  it('returns an empty list if there is no collection at all', done => {

    activitystore.organizedOrEditedActivitiesForMemberId('unknownMemberId', (err, activities) => {
      expect(err).to.not.exist();
      expect(activities.length).to.equal(0);
      done(err);
    });
  });

});
