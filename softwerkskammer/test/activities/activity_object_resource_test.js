'use strict';

const expect = require('must-dist');

const Activity = require('../../testutil/configureForTest').get('beans').get('activity');

const defaultName = 'Veranstaltung';

describe('Activity resource management', () => {

  describe('- on creation -', () => {
    it('registration is allowed for the default resource if no resources are present on creation', () => {
      const activity = new Activity();
      expect(activity.resourceNamed(defaultName).isRegistrationOpen()).to.be(true);
    });

    it('indicates whether a given resource has a waitinglist', () => {
      const activity = new Activity({resources: {Veranstaltung: {_registeredMembers: [], _waitinglist: []}}});
      expect(activity.resourceNamed('Veranstaltung').hasWaitinglist()).to.be(true);
    });

  });

  describe('- when adding members -', () => {
    /* eslint no-underscore-dangle: 0 */

    it('adds a member to the default resource', () => {
      const activity = new Activity();
      activity.resourceNamed(defaultName).addMemberId('memberID');
      expect(activity.resourceNamed(defaultName).registeredMembers()).to.contain('memberID');
    });

    it('sets the timestamp for the added member', () => {
      const activity = new Activity();
      activity.resourceNamed(defaultName).addMemberId('memberID');
      expect(activity.state.resources[defaultName]._registeredMembers[0].memberId).to.equal('memberID');
      expect(activity.state.resources[defaultName]._registeredMembers[0].registeredAt).to.exist();
    });

    it('sets the timestamp for the added member to the given moment', () => {
      const now = Date.now();
      const activity = new Activity();
      activity.resourceNamed(defaultName).addMemberId('memberID', now);
      expect(activity.state.resources[defaultName]._registeredMembers[0].memberId).to.equal('memberID');
      expect(activity.state.resources[defaultName]._registeredMembers[0].registeredAt).to.eql(new Date(now));
    });

    it('adds a member to a desired resource', () => {
      const activity = new Activity({
        url: 'myURL',
        resources: {
          Veranstaltung: {_registrationOpen: true, _registeredMembers: []},
          Doppelzimmer: {_registeredMembers: []}
        }
      });
      activity.resourceNamed('Veranstaltung').addMemberId('memberID');
      expect(activity.resourceNamed('Veranstaltung').registeredMembers()).to.contain('memberID');
    });

    it('does not do anything if the desired resource does not exist', () => {
      const activity = new Activity(
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

  describe('- when removing members -', () => {
    it('removes a registered member from the default resource', () => {
      const activity = new Activity({
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

    it('removes a registered member from a desired resource', () => {
      const activity = new Activity(
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

    it('does not remove a registered member from a desired resource if "unsubscription is not allowed"', () => {
      const activity = new Activity(
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

  describe('- when resetting an activity -', () => {
    it('resets id, url, members, dates and especially the owner for copied activity', () => {
      let activity = new Activity({
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
      expect(activity.startLuxon().toString()).to.not.contain('2013-4-4');
      expect(activity.endLuxon().toString()).to.not.contain('2013-4-5');
      expect(activity.id()).to.not.exist();
      expect(activity.url()).to.not.exist();
    });
  });

  describe('- when copying an activity -', () => {
    it('does not copy the owner', () => {
      const activity = new Activity({owner: 'owner'});
      const copy = activity.resetForClone();
      expect(copy.owner()).to.not.equal('owner');
    });

    it('does not copy a registered member from an existing activity', () => {
      // this constructor behaviour also affects loading of stored activities
      const activity = new Activity({url: 'url'});
      activity.resourceNamed(defaultName).addMemberId('memberID');
      const copy = activity.resetForClone();
      expect(copy.resourceNamed(defaultName).registeredMembers()).to.be.empty();
    });

    it('allows registration in a copied activity', () => {
      // this constructor behaviour also affects loading of stored activities
      const activity = new Activity({url: 'url'});
      const copy = activity.resetForClone();
      expect(copy.resourceNamed(defaultName).isRegistrationOpen()).to.be(true);
    });

    it('allows registration in a copied activity even if the registration was not open for the original', () => {
      // this constructor behaviour also affects loading of stored activities
      const activity = new Activity({url: 'url'});
      activity.state.resources[defaultName]._registrationOpen = false;
      const copy = activity.resetForClone();
      expect(copy.resourceNamed(defaultName).isRegistrationOpen()).to.be(true);
    });

    it('does not copy a registered member in a non-default resource from an existing activity', () => {
      // this constructor behaviour also affects loading of stored activities
      const activity = new Activity({url: 'url'});
      activity.resourceNamed('non-default').addMemberId('memberID');
      const copy = activity.resetForClone();
      expect(copy.resourceNamed('non-default').registeredMembers()).to.be.empty();
    });

    it('can add a new member to a copied activity', () => {
      const activity = new Activity({url: 'url'});
      activity.resourceNamed(defaultName).addMemberId('memberID');
      const copy = activity.resetForClone();
      copy.resourceNamed(defaultName).addMemberId('memberID2');
      expect(copy.resourceNamed(defaultName).registeredMembers()).to.contain('memberID2');
    });

    it('does not add a state property to any of its resources when copying', () => {
      const activity = new Activity({url: 'url'});
      activity.resourceNamed(defaultName).addMemberId('memberID');
      const copy = activity.resetForClone();
      expect(copy.state.resources[defaultName].state).to.be(undefined);
    });

    it('preserves all resources of a copied activity (i.e. the copy accepts registrations for the resources)', () => {
      const activity = new Activity({
        url: 'url', resources: {
          Einzelzimmer: {_registeredMembers: []},
          Doppelzimmer: {_registeredMembers: []}
        }
      });
      const copy = activity.resetForClone();
      copy.resourceNamed('Einzelzimmer').addMemberId('memberID2');
      copy.resourceNamed('Doppelzimmer').addMemberId('memberID3');
      expect(copy.resourceNamed('Einzelzimmer').registeredMembers()).to.contain('memberID2');
      expect(copy.resourceNamed('Doppelzimmer').registeredMembers()).to.contain('memberID3');
    });

    it('empties all resources of a copied activity', () => {
      const activity = new Activity({
        url: 'url', resources: {
          Einzelzimmer: {_registeredMembers: ['memberID']},
          Doppelzimmer: {_registeredMembers: ['memberID']}
        }
      });
      const copy = activity.resetForClone();
      expect(copy.resourceNamed('Einzelzimmer').registeredMembers()).to.be.empty();
      expect(copy.resourceNamed('Doppelzimmer').registeredMembers()).to.be.empty();
    });

    it('keeps the original ressource intact after copying', () => {
      const activity = new Activity({
        url: 'url', resources: {
          Veranstaltung: {
            _registeredMembers: [
              {memberId: 'memberID'}
            ]
          }
        }
      });
      activity.resetForClone();
      expect(activity.resourceNamed('Veranstaltung').registeredMembers()).to.contain('memberID');
    });

    it('copies the limits of all resources', () => {
      const activity = new Activity({
        url: 'url', resources: {
          Veranstaltung: {_registeredMembers: [], _limit: 10}
        }
      });
      const copy = activity.resetForClone();
      expect(copy.resourceNamed('Veranstaltung').numberOfFreeSlots()).to.equal(10);
    });
  });

  describe('- when querying registered members -', () => {
    const activityWithFourDifferentMembers = new Activity({
      resources: {
        'Veranstaltung': {
          _registeredMembers: [{memberId: 'memberID1'}, {memberId: 'memberID2'}, {memberId: 'memberID3'}],
          _waitinglist: [
            {_memberId: 'waiter'}
          ]
        }
      }
    });

    it('returns no members if the desired resource does not exist', () => {
      const activity = new Activity();
      expect(activity.resourceNamed('Nicht Existente Ressource').registeredMembers()).to.be.empty();
    });

    it('lists no registered members if there are no resources', () => {
      const activity = new Activity({resources: {}});
      expect(activity.allRegisteredMembers()).to.be.empty();
    });

    it('lists all registered members of any resource', () => {
      expect(activityWithFourDifferentMembers.allRegisteredMembers()).to.have.length(3);
      expect(activityWithFourDifferentMembers.allRegisteredMembers()).to.contain('memberID1');
      expect(activityWithFourDifferentMembers.allRegisteredMembers()).to.contain('memberID2');
      expect(activityWithFourDifferentMembers.allRegisteredMembers()).to.contain('memberID3');
    });

    it('can tell if a memberID is registered in any resource', () => {
      expect(activityWithFourDifferentMembers.isAlreadyRegistered('memberID1')).to.be(true);
      expect(activityWithFourDifferentMembers.isAlreadyRegistered('memberID2')).to.be(true);
      expect(activityWithFourDifferentMembers.isAlreadyRegistered('memberID3')).to.be(true);
    });

  });

  describe('- when talking about participant numbers -', () => {

    it('knows when a resource is full and when not', () => {
      const activity = new Activity({
        url: 'url', resources: {
          Veranstaltung: {_registrationOpen: true, _registeredMembers: [], _limit: 1}
        }
      });

      expect(activity.resourceNamed('Veranstaltung').isFull()).to.be(false);

      activity.resourceNamed('Veranstaltung').addMemberId('memberId');

      expect(activity.resourceNamed('Veranstaltung').isFull()).to.be(true);
    });

    it('knows how many free slots are in a resource', () => {
      const activity = new Activity({
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
