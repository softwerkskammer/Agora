'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');

var Activity = require('../../testutil/configureForTest').get('beans').get('activity');

var defaultName = 'Veranstaltung';

describe('Activity resource management', function () {

  describe('- on creation -', function () {
    it('lists the name of the default resource if no resources are present on creation', function () {
      var activity = new Activity();
      expect(activity.resourceNames()).to.have.length(1);
      expect(activity.resourceNames()).to.contain(defaultName);
    });

    it('registration is allowed for the default resource if no resources are present on creation', function () {
      var activity = new Activity();
      expect(activity.resourceNamed(defaultName).isRegistrationOpen()).to.be(true);
    });

    it('lists the names of all resources if resources are present on creation', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}, Doppelzimmer: { _registeredMembers: []}}});
      expect(activity.resourceNames()).to.have.length(2);
      expect(activity.resourceNames()).to.contain('Einzelzimmer');
      expect(activity.resourceNames()).to.contain('Doppelzimmer');
    });

    it('orders the resources if their order is given via fillFromUI', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: []}, Doppelzimmer: { _registeredMembers: []}}});
      activity.fillFromUI({resources: {names: ['Doppelzimmer', 'Einzelzimmer'], limits: ['', ''], previousNames: ['Einzelzimmer', 'Doppelzimmer']}});
      expect(activity.resourceNames()).to.have.length(2);
      expect(activity.resourceNames()[0]).to.equal('Doppelzimmer');
      expect(activity.resourceNames()[1]).to.equal('Einzelzimmer');
    });

    it('ignores resources that do not contain something valid on creation', function () {
      var activity = new Activity({resources: {Einzelzimmer: null, Doppelzimmer: undefined, Heuboden: ''}});
      expect(activity.resourceNames()).to.be.empty();
    });

    it('adds a default resource if there is no resources property in the activity', function () {
      var activity = new Activity({});
      expect(activity.resourceNames()).to.have.length(1);
      expect(activity.resourceNames()).to.contain(defaultName);
    });

    it('adds no default resource if there are no resources in the activity resources property', function () {
      var activity = new Activity({ resources: {}});
      expect(activity.resourceNames()).to.be.empty();
      expect(activity.resourceNames()).to.exist(); // not undefined, not null
    });

    it('indicates whether a given resource has a waitinglist', function () {
      var activity = new Activity({resources: {Einzelzimmer: { _registeredMembers: [], _waitinglist: []}}});
      expect(activity.resourceNamed('Einzelzimmer').hasWaitinglist()).to.be(true);
    });

  });

  describe('- when adding members -', function () {
    /* eslint no-underscore-dangle: 0 */

    it('adds a member to the default resource', function () {
      var activity = new Activity();
      activity.resourceNamed(defaultName).addMemberId('memberID');
      expect(activity.resourceNamed(defaultName).registeredMembers()).to.contain('memberID');
    });

    it('sets the timestamp for the added member', function () {
      var activity = new Activity();
      activity.resourceNamed(defaultName).addMemberId('memberID');
      expect(activity.state.resources[defaultName]._registeredMembers[0].memberId).to.equal('memberID');
      expect(activity.state.resources[defaultName]._registeredMembers[0].registeredAt).to.exist();
    });

    it('sets the timestamp for the added member to the given moment', function () {
      var now = moment();
      var activity = new Activity();
      activity.resourceNamed(defaultName).addMemberId('memberID', now);
      expect(activity.state.resources[defaultName]._registeredMembers[0].memberId).to.equal('memberID');
      expect(activity.state.resources[defaultName]._registeredMembers[0].registeredAt).to.equal(now.toDate());
    });

    it('adds a member to a desired resource', function () {
      var activity = new Activity({url: 'myURL', resources: {Einzelzimmer: { _registrationOpen: true, _registeredMembers: []}, Doppelzimmer: { _registeredMembers: []}}});
      activity.resourceNamed('Einzelzimmer').addMemberId('memberID');
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberID');
      expect(activity.resourceNamed('Doppelzimmer').registeredMembers()).to.be.empty();
    });

    it('does not do anything if the desired resource does not exist', function () {
      var activity = new Activity(
        {url: 'myURL', resources: {
          'default': { _registeredMembers: [
            {memberId: 'memberID'}
          ]}
        }}
      );
      activity.resourceNamed('Einzelzimmer').addMemberId('memberID');
      expect(activity.resourceNames()).to.have.length(1);
      expect(activity.resourceNamed('default').registeredMembers()).to.contain('memberID');
    });
  });

  describe('- when removing members -', function () {
    it('removes a registered member from the default resource', function () {
      var activity = new Activity({url: 'myURL', resources: { Veranstaltung: { _registeredMembers: [
        {memberId: 'memberID'}
      ]}}});
      activity.resourceNamed(defaultName).removeMemberId('memberID');
      expect(activity.resourceNamed(defaultName).registeredMembers()).to.be.empty();
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
        }}
      );
      activity.resourceNamed('Doppelzimmer').removeMemberId('memberID');
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberID');
      expect(activity.resourceNamed('Doppelzimmer').registeredMembers()).to.be.empty();
    });

    it('does not remove a registered member from a desired resource if "unsubscription is not allowed"', function () {
      var activity = new Activity(
        {url: 'myURL', resources: {
          Doppelzimmer: { _registeredMembers: [
            {memberId: 'memberID'}
          ], _canUnsubscribe: false }
        }}
      );
      activity.resourceNamed('Doppelzimmer').removeMemberId('memberID');
      expect(activity.resourceNamed('Doppelzimmer').registeredMembers()).to.contain('memberID');
    });

    it('does not do anything if the desired resource does not exist', function () {
      var activity = new Activity(
        {url: 'myURL', resources: {
          'default': { _registeredMembers: [
            {memberId: 'memberID'}
          ]}
        }}
      );
      activity.resourceNamed('Doppelzimmer').removeMemberId('memberID');
      expect(activity.resourceNames()).to.have.length(1);
      expect(activity.resourceNamed('default').registeredMembers()).to.contain('memberID');
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
        resources: { 'default': { _registeredMembers: [
          {memberId: 'memberID'}
        ] }},
        owner: 'owner'
      });
      activity = activity.resetForClone();
      expect(activity.resourceNamed('default').registeredMembers()).to.be.empty();
      expect(activity.startMoment().format()).to.not.contain('2013-4-4');
      expect(activity.endMoment().format()).to.not.contain('2013-4-5');
      expect(activity.id()).to.not.exist();
      expect(activity.url()).to.not.exist();
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
      activity.resourceNamed(defaultName).addMemberId('memberID');
      var copy = new Activity().copyFrom(activity);
      expect(copy.resourceNamed(defaultName).registeredMembers()).to.be.empty();
    });

    it('allows registration in a copied activity', function () {
      // this constructor behaviour also affects loading of stored activities
      var activity = new Activity({url: 'url'});
      var copy = new Activity().copyFrom(activity);
      expect(copy.resourceNamed(defaultName).isRegistrationOpen()).to.be(true);
    });

    it('allows registration in a copied activity even if the registration was not open for the original', function () {
      // this constructor behaviour also affects loading of stored activities
      var activity = new Activity({url: 'url'});
      activity.state.resources[defaultName]._registrationOpen = false;
      var copy = new Activity().copyFrom(activity);
      expect(copy.resourceNamed(defaultName).isRegistrationOpen()).to.be(true);
    });

    it('does not copy a registered member in a non-default resource from an existing activity', function () {
      // this constructor behaviour also affects loading of stored activities
      var activity = new Activity({url: 'url'});
      activity.resourceNamed('non-default').addMemberId('memberID');
      var copy = new Activity().copyFrom(activity);
      expect(copy.resourceNamed('non-default').registeredMembers()).to.be.empty();
    });

    it('can add a new member to a copied activity', function () {
      var activity = new Activity({url: 'url'});
      activity.resourceNamed(defaultName).addMemberId('memberID');
      var copy = new Activity().copyFrom(activity);
      copy.resourceNamed(defaultName).addMemberId('memberID2');
      expect(copy.resourceNamed(defaultName).registeredMembers()).to.contain('memberID2');
    });

    it('does not add a state property to any of its resources when copying', function () {
      var activity = new Activity({url: 'url'});
      activity.resourceNamed(defaultName).addMemberId('memberID');
      var copy = new Activity().copyFrom(activity);
      expect(copy.state.resources[defaultName].state).to.be(undefined);
    });

    it('preserves all resources of a copied activity (i.e. the copy accepts registrations for the resources)', function () {
      var activity = new Activity({url: 'url', resources: {
        Einzelzimmer: { _registeredMembers: []},
        Doppelzimmer: { _registeredMembers: []}
      }});
      var copy = new Activity().copyFrom(activity);
      copy.resourceNamed('Einzelzimmer').addMemberId('memberID2');
      copy.resourceNamed('Doppelzimmer').addMemberId('memberID3');
      expect(copy.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberID2');
      expect(copy.resourceNamed('Doppelzimmer').registeredMembers()).to.contain('memberID3');
    });

    it('empties all resources of a copied activity', function () {
      var activity = new Activity({url: 'url', resources: {
        Einzelzimmer: { _registeredMembers: ['memberID']},
        Doppelzimmer: { _registeredMembers: ['memberID']}
      }});
      var copy = new Activity().copyFrom(activity);
      expect(copy.resourceNamed('Einzelzimmer').registeredMembers()).to.be.empty();
      expect(copy.resourceNamed('Doppelzimmer').registeredMembers()).to.be.empty();
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
      expect(activity.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberID');
      expect(activity.resourceNamed('Doppelzimmer').registeredMembers()).to.contain('memberID');
    });

    it('copies the limits of all resources', function () {
      var activity = new Activity({url: 'url', resources: {
        Teilnehmer: { _registeredMembers: [], _limit: 10},
        Einzelzimmer: { _registeredMembers: [], _limit: 20},
        Doppelzimmer: { _registeredMembers: [], _limit: 30}
      }});
      var copy = new Activity().copyFrom(activity);
      expect(copy.resourceNamed('Teilnehmer').numberOfFreeSlots()).to.equal(10);
      expect(copy.resourceNamed('Einzelzimmer').numberOfFreeSlots()).to.equal(20);
      expect(copy.resourceNamed('Doppelzimmer').numberOfFreeSlots()).to.equal(30);
    });
  });

  describe('- when querying registered members -', function () {
    var activityWithFourDifferentMembers = new Activity({ resources: {
      'default': { _registeredMembers: [{memberId: 'memberID1'}] },
      Einzelzimmer: { _registeredMembers: [
        {memberId: 'memberID2'}
      ]},
      Doppelzimmer: { _registeredMembers: [
        {memberId: 'memberID3'}
      ]},
      Waitingroom: { _registeredMembers: [], _waitinglist: [
        { _memberId: 'waiter' }
      ]}
    }});

    it('returns no members if the desired resource does not exist', function () {
      var activity = new Activity();
      expect(activity.resourceNamed('Nicht Existente Ressource').registeredMembers()).to.be.empty();
    });

    it('lists no registered members if there are no resources', function () {
      var activity = new Activity({ resources: {}});
      expect(activity.allRegisteredMembers()).to.be.empty();
    });

    it('lists all registered members of any resource', function () {
      expect(activityWithFourDifferentMembers.allRegisteredMembers()).to.have.length(3);
      expect(activityWithFourDifferentMembers.allRegisteredMembers()).to.contain('memberID1');
      expect(activityWithFourDifferentMembers.allRegisteredMembers()).to.contain('memberID2');
      expect(activityWithFourDifferentMembers.allRegisteredMembers()).to.contain('memberID3');
    });

    it('can tell if a memberID is registered in any resource', function () {
      expect(activityWithFourDifferentMembers.isAlreadyRegistered('memberID1')).to.be(true);
      expect(activityWithFourDifferentMembers.isAlreadyRegistered('memberID2')).to.be(true);
      expect(activityWithFourDifferentMembers.isAlreadyRegistered('memberID3')).to.be(true);
    });

    it('can return the registered resources for a memberID', function () {
      var result = activityWithFourDifferentMembers.registeredResourcesFor('memberID1');
      expect(result).to.have.length(1);
      expect(result[0].resourceName).to.be('default');
    });

    it('can return the waitinglist resources for a memberID', function () {
      var result = activityWithFourDifferentMembers.waitinglistResourcesFor('waiter');
      expect(result).to.have.length(1);
      expect(result[0].resourceName).to.be('Waitingroom');
    });

    it('lists a registered member only once even when he registered for multiple resources', function () {
      var activity = new Activity({ resources: {
        'default': { _registeredMembers: [
          {memberId: 'memberID'}
        ]},
        Einzelzimmer: { _registeredMembers: [
          {memberId: 'memberID'}
        ]},
        Doppelzimmer: { _registeredMembers: [
          {memberId: 'memberID'}
        ]}
      }});
      expect(activity.allRegisteredMembers()).to.have.length(1);
      expect(activity.allRegisteredMembers()).to.contain('memberID');
    });
  });

  describe('- when talking about participant numbers -', function () {

    it('knows when a resource is full and when not', function () {
      var activity = new Activity({url: 'url', resources: {
        Teilnehmer: { _registrationOpen: true, _registeredMembers: [], _limit: 1}
      }});

      expect(activity.resourceNamed('Teilnehmer').isFull()).to.be(false);

      activity.resourceNamed('Teilnehmer').addMemberId('memberId');

      expect(activity.resourceNamed('Teilnehmer').isFull()).to.be(true);
    });

    it('knows how many free slots are in a resource', function () {
      var activity = new Activity({url: 'url', resources: {
        Teilnehmer: { _registrationOpen: true, _registeredMembers: [], _limit: 10}
      }});

      expect(activity.resourceNamed('Teilnehmer').numberOfFreeSlots()).to.equal(10);

      activity.resourceNamed('Teilnehmer').addMemberId('memberId');

      expect(activity.resourceNamed('Teilnehmer').numberOfFreeSlots()).to.equal(9);
    });
  });

});
