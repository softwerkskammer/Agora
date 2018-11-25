'use strict';

const expect = require('must-dist');

const Activity = require('../../testutil/configureForTest').get('beans').get('activity');

function checkResourceNames(activity, resourceName1, resourceName2) {
  if (resourceName2) {
    expect(activity.resourceNames().length, 'Number of resource names').to.equal(2);
    expect(activity.resourceNames(), 'Name of resource').to.contain(resourceName1);
    expect(activity.resourceNames(), 'Name of resource').to.contain(resourceName2);
  } else {
    expect(activity.resourceNames().length, 'Number of resource names').to.equal(1);
    expect(activity.resourceNames(), 'Name of resource').to.contain(resourceName1);
  }
}

describe('Activity (when filled from UI)', () => {

  it('does not change the activity\'s ID', () => {
    const activity = new Activity({id: 'myId'}).fillFromUI({});
    expect(activity.id()).to.equal('myId');
  });

  it('parses start date and time using default timezone', () => {
    const activity = new Activity().fillFromUI({
      url: 'myURL',
      startDate: '01.02.2013',
      startTime: '12:34'
    });
    expect(activity.startMoment().format()).to.equal('2013-02-01T12:34:00+01:00');
  });

  it('parses end date and time using default timezone', () => {
    const activity = new Activity().fillFromUI({
      url: 'myURL',
      endDate: '01.08.2013',
      endTime: '12:34'
    });
    expect(activity.endMoment().format()).to.equal('2013-08-01T12:34:00+02:00');
  });

  describe('creates a resource', () => {

    it('without limit', () => {
      const activity = new Activity().fillFromUI({resources: {names: 'Veranstaltung', limits: '', previousNames: ''}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('with limit 0', () => {
      const activity = new Activity().fillFromUI({resources: {names: 'Veranstaltung', limits: '0', previousNames: ''}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(0);
    });

    it('with limit', () => {
      const activity = new Activity().fillFromUI({resources: {names: 'Veranstaltung', limits: '10', previousNames: ''}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(10);
    });

    it('without limit when the entered limit is negative', () => {
      const activity = new Activity().fillFromUI({resources: {names: 'Veranstaltung', limits: '-10', previousNames: ''}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('without limit when the entered limit is not an integer', () => {
      const activity = new Activity().fillFromUI({
        resources: {
          names: 'Veranstaltung',
          limits: 'dudu',
          previousNames: ''
        }
      });

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('with open registration', () => {
      const activity = new Activity().fillFromUI({
        resources: {
          names: 'Veranstaltung',
          limits: 'dudu',
          previousNames: '',
          isRegistrationOpen: 'yes'
        }
      });

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').isRegistrationOpen(), 'Registration at resource').to.equal(true);
    });

    it('with closed registration', () => {
      const activity = new Activity().fillFromUI({
        resources: {
          names: 'Veranstaltung',
          limits: 'dudu',
          previousNames: '',
          isRegistrationOpen: 'no'
        }
      });

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').isRegistrationOpen(), 'Registration at resource').to.equal(false);
    });

    it('with unsubscription possible', () => {
      const activity = new Activity().fillFromUI({
        resources: {
          names: 'Veranstaltung',
          limits: 'dudu',
          previousNames: '',
          canUnsubscribe: 'yes'
        }
      });

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').canUnsubscribe(), 'Unsubscription at resource').to.equal(true);
    });

    it('with unsubscription not possible', () => {
      const activity = new Activity().fillFromUI({
        resources: {
          names: 'Veranstaltung',
          limits: 'dudu',
          previousNames: '',
          canUnsubscribe: 'no'
        }
      });

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').canUnsubscribe(), 'Unsubscription at resource').to.equal(false);
    });

    it('with ID', () => {
      const activity = new Activity().fillFromUI({
        assignedGroup: 'My Group',
        title: 'My Title',
        startDate: '01.02.2013',
        startTime: '20:15'
      });

      expect(activity.id()).to.equal('My_Group_My_Title_1.2.2013__20_15_00');
    });

    it('with several resources where only one has open registration', () => {
      const activity = new Activity().fillFromUI({
        resources: {
          names: 'Something irrelevant', limits: '',
          isRegistrationOpen: 'yes'
        }
      });

      expect(activity.resourceNamed('Veranstaltung').isRegistrationOpen(), 'Registration at resource R4').to.equal(true);
    });

  });

  describe('adds a limit', () => {

    it('to a resource without limit', () => {
      const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: []}}})
        .fillFromUI({resources: {names: 'Veranstaltung', limits: '10', previousNames: 'Veranstaltung'}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(10);
    });

    it('to a resource with registered members', () => {
      const activity = new Activity({
        resources: {
          Veranstaltung: {
            _registeredMembers: [
              {memberId: 'memberId'}
            ]
          }
        }
      })
        .fillFromUI({resources: {names: 'Veranstaltung', limits: '10', previousNames: 'Veranstaltung'}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(10);
      expect(activity.resourceNamed('Veranstaltung').registeredMembers().length, 'Member count of resource').to.equal(1);
      expect(activity.resourceNamed('Veranstaltung').registeredMembers(), 'Members of resource').to.contain('memberId');
    });

    it('to a resource with too many registered members', () => {
      const activity = new Activity({
        resources: {
          Veranstaltung: {
            _registeredMembers: [
              {memberId: 'memberId1'},
              {memberId: 'memberId2'}
            ]
          }
        }
      })
        .fillFromUI({resources: {names: 'Veranstaltung', limits: '1', previousNames: 'Veranstaltung'}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(1);
      expect(activity.resourceNamed('Veranstaltung').registeredMembers().length, 'Member count of resource').to.equal(2);
      expect(activity.resourceNamed('Veranstaltung').registeredMembers(), 'Members of resource').to.contain('memberId1');
      expect(activity.resourceNamed('Veranstaltung').registeredMembers(), 'Members of resource').to.contain('memberId2');
    });

  });

  describe('removes a limit', () => {

    it('from a resource with limit', () => {
      const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: 'Veranstaltung', limits: '', previousNames: 'Veranstaltung'}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('from a resource with limit when the new limit is negative', () => {
      const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: 'Veranstaltung', limits: '-1', previousNames: 'Veranstaltung'}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('from a resource with limit when the new limit is not an integer', () => {
      const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: 'Veranstaltung', limits: 'tuut', previousNames: 'Veranstaltung'}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('from a resource with registered members', () => {
      const activity = new Activity({
        resources: {
          Veranstaltung: {
            _registeredMembers: [
              {memberId: 'memberId'}
            ], limit: 10
          }
        }
      })
        .fillFromUI({resources: {names: 'Veranstaltung', limits: '', previousNames: 'Veranstaltung'}});

      checkResourceNames(activity, 'Veranstaltung');
      expect(activity.resourceNamed('Veranstaltung').limit(), 'Limit of resource').to.equal(undefined);
      expect(activity.resourceNamed('Veranstaltung').registeredMembers().length, 'Member count of resource').to.equal(1);
      expect(activity.resourceNamed('Veranstaltung').registeredMembers(), 'Members of resource').to.contain('memberId');
    });

  });

});
