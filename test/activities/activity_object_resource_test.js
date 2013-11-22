"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;
var moment = require('moment-timezone');

var Activity = conf.get('beans').get('activity');

var defaultName = 'Veranstaltung';

describe('Activity resource management', function () {

  describe('- on creation -', function () {
    it('lists the name of the default resource if no resources are present on creation', function () {
      var activity = new Activity();
      expect(activity.resourceNames().length).to.equal(1);
      expect(activity.resourceNames()).to.contain(defaultName);
    });

    it('lists the name of all resources if resources are present on creation', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}, Doppelzimmer: { _registeredMembers: []}}});
      expect(activity.resourceNames().length).to.equal(2);
      expect(activity.resourceNames()).to.contain('Einzelzimmer');
      expect(activity.resourceNames()).to.contain('Doppelzimmer');
    });

    it('ignores resources that do not contain something valid on creation', function () {
      var activity = new Activity({resources: {Einzelzimmer: null, Doppelzimmer: undefined, Heuboden: ""}});
      expect(activity.resourceNames()).to.be.empty;
    });

    it('adds a default resource if there is no resources property in the activity', function () {
      var activity = new Activity({});
      expect(activity.resourceNames().length).to.equal(1);
      expect(activity.resourceNames()).to.contain(defaultName);
    });

    it('adds no default resource if there are no resources in the activity resources property', function () {
      var activity = new Activity({ resources: {}});
      expect(activity.resourceNames()).to.be.empty;
      expect(!!activity.resourceNames()).to.be.true; // not undefined, not null
    });
  });

  describe('- when adding members -', function () {
    it('adds a member to the default resource', function () {
      var activity = new Activity();
      activity.addMemberId('memberID', defaultName);
      expect(activity.registeredMembers(defaultName)).to.contain('memberID');
    });

    it('sets the timestamp for the added member', function () {
      var activity = new Activity();
      activity.addMemberId('memberID', defaultName);
      expect(activity.state.resources[defaultName]._registeredMembers[0].memberId).to.equal('memberID');
      expect(!!activity.state.resources[defaultName]._registeredMembers[0].registeredAt).to.be.true;
    });

    it('sets the timestamp for the added member to the given moment', function () {
      var now = new moment();
      var activity = new Activity();
      activity.addMemberId('memberID', defaultName, now);
      expect(activity.state.resources[defaultName]._registeredMembers[0].memberId).to.equal('memberID');
      expect(activity.state.resources[defaultName]._registeredMembers[0].registeredAt).to.equal(now.toDate());
    });

    it('adds a member to a desired resource', function () {
      var activity = new Activity({url: 'myURL', resources: {Einzelzimmer: { _registeredMembers: []}, Doppelzimmer: { _registeredMembers: []}}});
      activity.addMemberId('memberID', 'Einzelzimmer');
      expect(activity.registeredMembers('Einzelzimmer')).to.contain('memberID');
      expect(activity.registeredMembers('Doppelzimmer')).to.be.empty;
    });

    it('does not do anything if the desired resource does not exist', function () {
      var activity = new Activity(
        {url: 'myURL', resources: {
          default: { _registeredMembers: [
            {memberId: 'memberID'}
          ]}
        }});
      activity.addMemberId('memberID', 'Einzelzimmer');
      expect(activity.resourceNames().length).to.equal(1);
      expect(activity.registeredMembers('default')).to.contain('memberID');
    });
  });

  describe('- when removing members -', function () {
    it('removes a registered member from the default resource', function () {
      var activity = new Activity({url: 'myURL', resources: { Veranstaltung: { _registeredMembers: [
        {memberId: 'memberID'}
      ]}}});
      activity.removeMemberId('memberID', defaultName);
      expect(activity.registeredMembers(defaultName)).to.be.empty;
    });

    it('removes a registered member from a desired resource', function () {
      var activity = new Activity(
        {url: 'myURL', resources: {
          Einzelzimmer: { _registeredMembers: [
            {memberId: 'memberID'}
          ]},
          Doppelzimmer: { _registeredMembers: [
            {memberId: 'memberID'}
          ]}
        }});
      activity.removeMemberId('memberID', 'Doppelzimmer');
      expect(activity.registeredMembers('Einzelzimmer')).to.contain('memberID');
      expect(activity.registeredMembers('Doppelzimmer')).to.be.empty;
    });

    it('does not do anything if the desired resource does not exist', function () {
      var activity = new Activity(
        {url: 'myURL', resources: {
          default: { _registeredMembers: [
            {memberId: 'memberID'}
          ]}
        }});
      activity.removeMemberId('memberID', 'Doppelzimmer');
      expect(activity.resourceNames().length).to.equal(1);
      expect(activity.registeredMembers('default')).to.contain('memberID');
    });
  });

  describe('- when resetting an activity -', function () {
    it('resets id, url, members, dates and especially the owner for copied activity', function () {
      var activity = new Activity({
        id: 'ID',
        title: 'Title',
        startDate: '4.4.2013',
        endDate: '5.4.2013',
        url: 'myURL',
        resources: { default: { _registeredMembers: [
          {memberId: 'memberID'}
        ] }},
        owner: 'owner'
      });
      activity = activity.resetForClone();
      expect(activity.registeredMembers('default')).to.be.empty;
      expect(activity.startDate()).to.not.equal('04.04.2013');
      expect(activity.endDate()).to.not.equal('05.04.2013');
      expect(!!activity.id()).to.be.false;
      expect(!!activity.url()).to.be.false;
    });
  });

  describe('- when copying an activity -', function () {
    it('does not copy the owner', function () {
      var activity = new Activity({owner: 'owner'});
      var copy = new Activity().copyFrom(activity);
      expect(copy.owner()).to.not.equal('owner');
    });

    it('does not copy a registered member from an existing activity', function () {
      // this constructor behaviour also affects loading of stored activities
      var activity = new Activity({url: 'url'});
      activity.addMemberId('memberID', defaultName);
      var copy = new Activity().copyFrom(activity);
      expect(copy.registeredMembers(defaultName)).to.be.empty;
    });

    it('does not copy a registered member in a non-default resource from an existing activity', function () {
      // this constructor behaviour also affects loading of stored activities
      var activity = new Activity({url: 'url'});
      activity.addMemberId('memberID', 'non-default');
      var copy = new Activity().copyFrom(activity);
      expect(copy.registeredMembers('non-default')).to.be.empty;
    });

    it('can add a new member to a copied activity', function () {
      var activity = new Activity({url: 'url'});
      activity.addMemberId('memberID', defaultName);
      var copy = new Activity().copyFrom(activity);
      copy.addMemberId('memberID2', defaultName);
      expect(copy.registeredMembers(defaultName)).to.contain('memberID2');
    });

    it('does not add a state property to any of its resources when copying', function () {
      var activity = new Activity({url: 'url'});
      activity.addMemberId('memberID', defaultName);
      var copy = new Activity().copyFrom(activity);
      expect(copy.state.resources[defaultName].state).to.be.undefined;
    });

    it('preserves all resources of a copied activity (i.e. the copy accepts registrations for the resources)', function () {
      var activity = new Activity({url: 'url', resources: {
        Einzelzimmer: { _registeredMembers: []},
        Doppelzimmer: { _registeredMembers: []}
      }});
      var copy = new Activity().copyFrom(activity);
      copy.addMemberId('memberID2', 'Einzelzimmer');
      copy.addMemberId('memberID3', 'Doppelzimmer');
      expect(copy.registeredMembers('Einzelzimmer')).to.contain('memberID2');
      expect(copy.registeredMembers('Doppelzimmer')).to.contain('memberID3');
    });

    it('empties all resources of a copied activity', function () {
      var activity = new Activity({url: 'url', resources: {
        Einzelzimmer: { _registeredMembers: ['memberID']},
        Doppelzimmer: { _registeredMembers: ['memberID']}
      }});
      var copy = new Activity().copyFrom(activity);
      expect(copy.registeredMembers('Einzelzimmer')).to.be.empty;
      expect(copy.registeredMembers('Doppelzimmer')).to.be.empty;
    });

    it('keeps the original ressource intact after copying', function () {
      var activity = new Activity({url: 'url', resources: {
        Einzelzimmer: { _registeredMembers: [
          {memberId: 'memberID'}
        ]},
        Doppelzimmer: { _registeredMembers: [
          {memberId: 'memberID'}
        ]}
      }});
      new Activity().copyFrom(activity);
      expect(activity.registeredMembers('Einzelzimmer')).to.contain('memberID');
      expect(activity.registeredMembers('Doppelzimmer')).to.contain('memberID');
    });

    it('copies the limits of all resources', function () {
      var activity = new Activity({url: 'url', resources: {
        Teilnehmer: { _registeredMembers: [], _limit: 10},
        Einzelzimmer: { _registeredMembers: [], _limit: 20},
        Doppelzimmer: { _registeredMembers: [], _limit: 30}
      }});
      var copy = new Activity().copyFrom(activity);
      expect(copy.numberOfFreeSlots('Teilnehmer')).to.equal(10);
      expect(copy.numberOfFreeSlots('Einzelzimmer')).to.equal(20);
      expect(copy.numberOfFreeSlots('Doppelzimmer')).to.equal(30);
    });
  });

  describe('- when querying registered members -', function () {
    it('returns no members if the desired resource does not exist', function () {
      var activity = new Activity();
      expect(activity.registeredMembers('Nicht Existente Ressource')).to.be.empty;
    });

    it('lists no registered members if there are no resources', function () {
      var activity = new Activity({ resources: {}});
      expect(activity.allRegisteredMembers()).to.be.empty;
    });

    it('lists all registered members of any resource', function () {
      var activity = new Activity({ resources: {
        default: { _registeredMembers: [
          {memberId: 'memberID1'}
        ]},
        Einzelzimmer: { _registeredMembers: [
          {memberId: 'memberID2'}
        ]},
        Doppelzimmer: { _registeredMembers: [
          {memberId: 'memberID3'}
        ]}
      }});
      expect(activity.allRegisteredMembers().length).to.equal(3);
      expect(activity.allRegisteredMembers()).to.contain('memberID1');
      expect(activity.allRegisteredMembers()).to.contain('memberID2');
      expect(activity.allRegisteredMembers()).to.contain('memberID3');
    });

    it('lists a registered member only once even when he registered for multiple resources', function () {
      var activity = new Activity({ resources: {
        default: { _registeredMembers: [
          {memberId: 'memberID'}
        ]},
        Einzelzimmer: { _registeredMembers: [
          {memberId: 'memberID'}
        ]},
        Doppelzimmer: { _registeredMembers: [
          {memberId: 'memberID'}
        ]}
      }});
      expect(activity.allRegisteredMembers().length).to.equal(1);
      expect(activity.allRegisteredMembers()).to.contain('memberID');
    });
  });

  describe("- when talking about participant numbers -", function () {

    it("knows when a resource is full and when not", function () {
      var activity = new Activity({url: 'url', resources: {
        Teilnehmer: { _registeredMembers: [], _limit: 1}
      }});

      expect(activity.isFull('Teilnehmer')).to.be.false;

      activity.addMemberId('memberId', 'Teilnehmer');

      expect(activity.isFull('Teilnehmer')).to.be.true;
    });

    it("knows how many free slots are in a resource", function () {
      var activity = new Activity({url: 'url', resources: {
        Teilnehmer: { _registeredMembers: [], _limit: 10}
      }});

      expect(activity.numberOfFreeSlots('Teilnehmer')).to.equal(10);

      activity.addMemberId('memberId', 'Teilnehmer');

      expect(activity.numberOfFreeSlots('Teilnehmer')).to.equal(9);
    });
  });
});
