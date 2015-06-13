'use strict';

var expect = require('must-dist');

var Activity = require('../../testutil/configureForTest').get('beans').get('activity');

function checkResourceNames(activity, resourceName1, resourceName2) {
  if (resourceName2) {
    expect(activity.resources().resourceNames().length, 'Number of resource names').to.equal(2);
    expect(activity.resources().resourceNames(), 'Name of resource').to.contain(resourceName1);
    expect(activity.resources().resourceNames(), 'Name of resource').to.contain(resourceName2);
  } else {
    expect(activity.resources().resourceNames().length, 'Number of resource names').to.equal(1);
    expect(activity.resources().resourceNames(), 'Name of resource').to.contain(resourceName1);
  }
}

describe('Activity (when filled from UI)', function () {

  it('does not change the activity\'s ID', function () {
    var activity = new Activity({id: 'myId'}).fillFromUI({});
    expect(activity.id()).to.equal('myId');
  });

  it('parses start date and time using default timezone', function () {
    var activity = new Activity().fillFromUI({
      url: 'myURL',
      startDate: '01.02.2013',
      startTime: '12:34'
    });
    expect(activity.startMoment().format()).to.equal('2013-02-01T12:34:00+01:00');
  });

  it('parses end date and time using default timezone', function () {
    var activity = new Activity().fillFromUI({
      url: 'myURL',
      endDate: '01.08.2013',
      endTime: '12:34'
    });
    expect(activity.endMoment().format()).to.equal('2013-08-01T12:34:00+02:00');
  });

  describe('creates a resource', function () {

    it('without limit', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: '', previousNames: ''}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('with limit 0', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: '0', previousNames: ''}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(0);
    });

    it('with limit', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: '10', previousNames: ''}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(10);
    });

    it('without limit when the entered limit is negative', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: '-10', previousNames: ''}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('without limit when the entered limit is not an integer', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: 'dudu', previousNames: ''}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('with open registration', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: 'dudu', previousNames: '', isRegistrationOpen: 'yes'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').isRegistrationOpen(), 'Registration at resource').to.equal(true);
    });

    it('with closed registration', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: 'dudu', previousNames: '', isRegistrationOpen: 'no'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').isRegistrationOpen(), 'Registration at resource').to.equal(false);
    });

    it('with unsubscription possible', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: 'dudu', previousNames: '', canUnsubscribe: 'yes'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').canUnsubscribe(), 'Unsubscription at resource').to.equal(true);
    });

    it('with unsubscription not possible', function () {
      var activity = new Activity().fillFromUI({resources: {names: 'Einzelzimmer', limits: 'dudu', previousNames: '', canUnsubscribe: 'no'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').canUnsubscribe(), 'Unsubscription at resource').to.equal(false);
    });

    it('with ID', function () {
      var activity = new Activity().fillFromUI({assignedGroup: 'My Group', title: 'My Title', startDate: '01.02.2013', startTime: '20:15'});

      expect(activity.id()).to.equal('My_Group_My_Title_Fri_Feb_01_2013_20_15_00_GMT+0100');
    });

    it('with several resources where only one has open registration', function () {
      var activity = new Activity().fillFromUI({resources: {names: ['R1', 'R2', 'R3', 'R4'], limits: ['', '', '', ''],
        previousNames: ['', '', '', ''], isRegistrationOpen: ['no', 'no', 'no', 'yes']}});

      expect(activity.resourceNamed('R1').isRegistrationOpen(), 'Registration at resource R1').to.equal(false);
      expect(activity.resourceNamed('R2').isRegistrationOpen(), 'Registration at resource R2').to.equal(false);
      expect(activity.resourceNamed('R3').isRegistrationOpen(), 'Registration at resource R3').to.equal(false);
      expect(activity.resourceNamed('R4').isRegistrationOpen(), 'Registration at resource R4').to.equal(true);
    });


  });

  it('creates two resources with limits', function () {
    var activity = new Activity().fillFromUI({resources: {names: ['Einzelzimmer', 'Doppelzimmer'], limits: ['10', '20'], previousNames: ['', '']}});

    checkResourceNames(activity, 'Einzelzimmer', 'Doppelzimmer');
    expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(10);
    expect(activity.resourceNamed('Doppelzimmer').limit(), 'Limit of resource').to.equal(20);
  });

  describe('adds a limit', function () {

    it('to a resource without limit', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
        .fillFromUI({resources: {names: 'Einzelzimmer', limits: '10', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(10);
    });

    it('to a resource with registered members', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ]}}})
        .fillFromUI({resources: {names: 'Einzelzimmer', limits: '10', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(10);
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers().length, 'Member count of resource').to.equal(1);
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers(), 'Members of resource').to.contain('memberId');
    });

    it('to a resource with too many registered members', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId1'},
        {memberId: 'memberId2'}
      ]}}})
        .fillFromUI({resources: {names: 'Einzelzimmer', limits: '1', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(1);
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers().length, 'Member count of resource').to.equal(2);
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers(), 'Members of resource').to.contain('memberId1');
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers(), 'Members of resource').to.contain('memberId2');
    });

  });

  describe('removes a limit', function () {

    it('from a resource with limit', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: 'Einzelzimmer', limits: '', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('from a resource with limit when the new limit is negative', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: 'Einzelzimmer', limits: '-1', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('from a resource with limit when the new limit is not an integer', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: 'Einzelzimmer', limits: 'tuut', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('from a resource with registered members', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ], limit: 10}}})
        .fillFromUI({resources: {names: 'Einzelzimmer', limits: '', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Einzelzimmer');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(undefined);
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers().length, 'Member count of resource').to.equal(1);
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers(), 'Members of resource').to.contain('memberId');
    });

  });

  describe('removes a resource', function () {

    it('without limit and without registered members', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
        .fillFromUI({resources: {names: '', limits: '', previousNames: 'Einzelzimmer'}});

      expect(activity.resources().resourceNames().length, 'Number of resource names').to.equal(0);
    });

    it('with limit and without registered members', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: '', limits: '', previousNames: 'Einzelzimmer'}});

      expect(activity.resources().resourceNames().length, 'Number of resource names').to.equal(0);
    });

    it('with limit and with registered members', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ], limit: 10}}})
        .fillFromUI({resources: {names: '', limits: '', previousNames: 'Einzelzimmer'}});

      expect(activity.resources().resourceNames().length, 'Number of resource names').to.equal(0);
    });

    it('if only the limit is set and not the name', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ], limit: 10}}})
        .fillFromUI({resources: {names: '', limits: '10', previousNames: 'Einzelzimmer'}});

      expect(activity.resources().resourceNames().length, 'Number of resource names').to.equal(0);
    });

  });

  describe('renames a resource', function () {

    it('without limit and without registered members', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
        .fillFromUI({resources: {names: 'Doppelzimmer', limits: '', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Doppelzimmer');
      expect(activity.resourceNamed('Doppelzimmer').limit(), 'Limit of resource').to.equal(undefined);
    });

    it('with limit and without registered members, changing the limit', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], limit: 10}}})
        .fillFromUI({resources: {names: 'Doppelzimmer', limits: '20', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Doppelzimmer');
      expect(activity.resourceNamed('Doppelzimmer').limit(), 'Limit of resource').to.equal(20);
    });

    it('without limit and without registered members, adding a limit', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}}})
        .fillFromUI({resources: {names: 'Doppelzimmer', limits: '10', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Doppelzimmer');
      expect(activity.resourceNamed('Doppelzimmer').limit(), 'Limit of resource').to.equal(10);
    });

    it('with registered members, changing the limit', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId'}
      ], limit: 10}}})
        .fillFromUI({resources: {names: 'Doppelzimmer', limits: '20', previousNames: 'Einzelzimmer'}});

      checkResourceNames(activity, 'Doppelzimmer');
      expect(activity.resourceNamed('Doppelzimmer').limit(), 'Limit of resource').to.equal(20);
      expect(activity.resourceNamed('Doppelzimmer').registeredMembers().length, 'Member count of resource').to.equal(1);
      expect(activity.resourceNamed('Doppelzimmer').registeredMembers(), 'Members of resource').to.contain('memberId');
    });

  });

  describe('replaces', function () {

    it('one resource by removing one and adding a new one', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId1'}
      ], limit: 10},
        Doppelzimmer: {_registeredMembers: ['memberId2'], limit: 20}}})
        .fillFromUI({resources: {names: ['Einzelzimmer', '', 'Schlafsaal'], limits: ['10', '20', '30'], previousNames: ['Einzelzimmer', 'Doppelzimmer', ''] }});

      checkResourceNames(activity, 'Einzelzimmer', 'Schlafsaal');
      expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(10);
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers().length, 'Member count of resource').to.equal(1);
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers(), 'Members of resource').to.contain('memberId1');
      expect(activity.resourceNamed('Schlafsaal').limit(), 'Limit of resource').to.equal(30);
      expect(activity.resourceNamed('Schlafsaal').registeredMembers().length, 'Member count of resource').to.equal(0);
    });

    it('two resources by renaming one, removing the second and adding a new one', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberId1'}
      ], limit: 10},
        Doppelzimmer: {_registeredMembers: ['memberId2'], limit: 20}}})
        .fillFromUI({resources: {names: ['Koje', '', 'Schlafsaal'], limits: ['10', '20', '30'], previousNames: ['Einzelzimmer', 'Doppelzimmer', ''] }});

      checkResourceNames(activity, 'Koje', 'Schlafsaal');
      expect(activity.resourceNamed('Koje').limit(), 'Limit of resource').to.equal(10);
      expect(activity.resourceNamed('Koje').registeredMembers().length, 'Member count of resource').to.equal(1);
      expect(activity.resourceNamed('Koje').registeredMembers(), 'Members of resource').to.contain('memberId1');
      expect(activity.resourceNamed('Schlafsaal').limit(), 'Limit of resource').to.equal(30);
      expect(activity.resourceNamed('Schlafsaal').registeredMembers().length, 'Member count of resource').to.equal(0);
    });

  });

  it('exchanges the names of two resources with registered members when the resource order is changed', function () {
    var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [
      {memberId: 'memberId1'}
    ], limit: 10},
      Doppelzimmer: {_registeredMembers: [
        {memberId: 'memberId2'}
      ], limit: 20}}})
      .fillFromUI({resources: {names: ['Doppelzimmer', 'Einzelzimmer'], limits: ['10', '20'], previousNames: ['Einzelzimmer', 'Doppelzimmer'] }});

    checkResourceNames(activity, 'Doppelzimmer', 'Einzelzimmer');
    expect(activity.resourceNamed('Doppelzimmer').limit(), 'Limit of resource').to.equal(10);
    expect(activity.resourceNamed('Doppelzimmer').registeredMembers().length, 'Member count of resource').to.equal(1);
    expect(activity.resourceNamed('Doppelzimmer').registeredMembers(), 'Members of resource').to.contain('memberId1');
    expect(activity.resourceNamed('Einzelzimmer').limit(), 'Limit of resource').to.equal(20);
    expect(activity.resourceNamed('Einzelzimmer').registeredMembers().length, 'Member count of resource').to.equal(1);
    expect(activity.resourceNamed('Einzelzimmer').registeredMembers(), 'Members of resource').to.contain('memberId2');
  });

});
