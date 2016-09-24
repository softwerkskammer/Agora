'use strict';

var expect = require('must-dist');
var moment = require('moment-timezone');

var Activity = require('../../testutil/configureForTest').get('beans').get('activity');

var defaultName = 'Veranstaltung';

describe('Activity resource management', function () {

  describe('- on creation -', function () {
    it('registration is allowed for the default resource if no resources are present on creation', function () {
      var activity = new Activity();
      expect(activity.resourceNamed(defaultName).isRegistrationOpen()).to.be(true);
    });

    it('indicates whether a given resource has a waitinglist', function () {
      var activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [], _waitinglist: []}}});
      expect(activity.resourceNamed('Veranstaltung').hasWaitinglist()).to.be(true);
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
      expect(activity.state.resources[defaultName]._registeredMembers[0].registeredAt).to.eql(now.toDate());
    });

    it('adds a member to a desired resource', function () {
      var activity = new Activity({url: 'myURL',
        resources: {
          Veranstaltung: {_registrationOpen: true, _registeredMembers: []},
          Doppelzimmer: {_registeredMembers: []}
        }
      });
      activity.resourceNamed('Veranstaltung').addMemberId('memberID');
      expect(activity.resourceNamed('Veranstaltung').registeredMembers()).to.contain('memberID');
    });

    it('does not do anything if the desired resource does not exist', function () {
      var activity = new Activity(
        {
          url: 'myURL', resources: {
          'Veranstaltung': {
            _registeredMembers: [
              {memberId: 'memberID'}
            ]
          }
        }
        }
      );
      activity.resourceNamed('Einzelzimmer').addMemberId('memberID');
      expect(activity.resourceNames()).to.have.length(1);
      expect(activity.resourceNamed('Veranstaltung').registeredMembers()).to.contain('memberID');
    });
  });

  describe('- when removing members -', function () {
    it('removes a registered member from the default resource', function () {
      var activity = new Activity({
        url: 'myURL', resources: {
          Veranstaltung: {
            _registeredMembers: [
              {memberId: 'memberID'}
            ]
          }
        }
      });
      activity.resourceNamed(defaultName).removeMemberId('memberID');
      expect(activity.resourceNamed(defaultName).registeredMembers()).to.be.empty();
    });

    it('removes a registered member from a desired resource', function () {
      var activity = new Activity(
        {
          url: 'myURL', resources: {
          Veranstaltung: {
            _registeredMembers: [
              {memberId: 'memberID'}
            ]
          }
        }
        }
      );
      activity.resourceNamed('Veranstaltung').removeMemberId('memberID');
      expect(activity.resourceNamed('Veranstaltung').registeredMembers()).to.be.empty();
    });

    it('does not remove a registered member from a desired resource if "unsubscription is not allowed"', function () {
      var activity = new Activity(
        {
          url: 'myURL', resources: {
          Veranstaltung: {
            _registeredMembers: [
              {memberId: 'memberID'}
            ], _canUnsubscribe: false
          }
        }
        }
      );
      activity.resourceNamed('Veranstaltung').removeMemberId('memberID');
      expect(activity.resourceNamed('Veranstaltung').registeredMembers()).to.contain('memberID');
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
        resources: {
          'default': {
            _registeredMembers: [
              {memberId: 'memberID'}
            ]
          }
        },
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
      var activity = new Activity({
        url: 'url', resources: {
          Einzelzimmer: {_registeredMembers: []},
          Doppelzimmer: {_registeredMembers: []}
        }
      });
      var copy = new Activity().copyFrom(activity);
      copy.resourceNamed('Einzelzimmer').addMemberId('memberID2');
      copy.resourceNamed('Doppelzimmer').addMemberId('memberID3');
      expect(copy.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberID2');
      expect(copy.resourceNamed('Doppelzimmer').registeredMembers()).to.contain('memberID3');
    });

    it('empties all resources of a copied activity', function () {
      var activity = new Activity({
        url: 'url', resources: {
          Einzelzimmer: {_registeredMembers: ['memberID']},
          Doppelzimmer: {_registeredMembers: ['memberID']}
        }
      });
      var copy = new Activity().copyFrom(activity);
      expect(copy.resourceNamed('Einzelzimmer').registeredMembers()).to.be.empty();
      expect(copy.resourceNamed('Doppelzimmer').registeredMembers()).to.be.empty();
    });

    it('keeps the original ressource intact after copying', function () {
      var activity = new Activity({
        url: 'url', resources: {
          Veranstaltung: {
            _registeredMembers: [
              {memberId: 'memberID'}
            ]
          }
        }
      });
      new Activity().copyFrom(activity);
      expect(activity.resourceNamed('Veranstaltung').registeredMembers()).to.contain('memberID');
    });

    it('copies the limits of all resources', function () {
      var activity = new Activity({
        url: 'url', resources: {
          Veranstaltung: {_registeredMembers: [], _limit: 10}
        }
      });
      var copy = new Activity().copyFrom(activity);
      expect(copy.resourceNamed('Veranstaltung').numberOfFreeSlots()).to.equal(10);
    });
  });

  describe('- when querying registered members -', function () {
    var activityWithFourDifferentMembers = new Activity({
      resources: {
        'Veranstaltung': {
          _registeredMembers: [{memberId: 'memberID1'}, {memberId: 'memberID2'}, {memberId: 'memberID3'}],
          _waitinglist: [
            {_memberId: 'waiter'}
          ]
        }
      }
    });

    it('returns no members if the desired resource does not exist', function () {
      var activity = new Activity();
      expect(activity.resourceNamed('Nicht Existente Ressource').registeredMembers()).to.be.empty();
    });

    it('lists no registered members if there are no resources', function () {
      var activity = new Activity({resources: {}});
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

  });

  describe('- when talking about participant numbers -', function () {

    it('knows when a resource is full and when not', function () {
      var activity = new Activity({
        url: 'url', resources: {
          Veranstaltung: {_registrationOpen: true, _registeredMembers: [], _limit: 1}
        }
      });

      expect(activity.resourceNamed('Veranstaltung').isFull()).to.be(false);

      activity.resourceNamed('Veranstaltung').addMemberId('memberId');

      expect(activity.resourceNamed('Veranstaltung').isFull()).to.be(true);
    });

    it('knows how many free slots are in a resource', function () {
      var activity = new Activity({
        url: 'url', resources: {
          Veranstaltung: {_registrationOpen: true, _registeredMembers: [], _limit: 10}
        }
      });

      expect(activity.resourceNamed('Teilnehmer').numberOfFreeSlots()).to.equal(10);

      activity.resourceNamed('Teilnehmer').addMemberId('memberId');

      expect(activity.resourceNamed('Teilnehmer').numberOfFreeSlots()).to.equal(9);
    });
  });

});
