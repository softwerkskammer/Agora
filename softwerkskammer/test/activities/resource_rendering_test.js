'use strict';

const expect = require('must-dist');
const sinon = require('sinon').createSandbox();

const beans = require('../../testutil/configureForTest').get('beans');
const Resource = beans.get('resource');
const resourceRegistrationRenderer = beans.get('resourceRegistrationRenderer');
const Activity = beans.get('activity');

describe('ResourceRegistrationRenderer', () => {
  const resource = new Resource({});
  const activity = new Activity({});
  let resourceNamesList;

  function resultForState(state) {
    sinon.stub(resource, 'registrationStateFor').callsFake(() => state);
    return resourceRegistrationRenderer.htmlRepresentationOf(activity);
  }

  beforeEach(() => {
    resourceNamesList = ['name1'];
    sinon.stub(activity, 'resourceNamed').callsFake(() => resource);
    sinon.stub(activity, 'resourceNames').callsFake(() => resourceNamesList);
  });

  afterEach(() => {
    sinon.restore();
  });

  it('gives values for state "fixed"', () => {
    const result = resultForState(Resource.fixed);
    expect(result.type).to.not.exist();
    expect(result.displayText).to.equal('activities.unsubscribe_not_possible');
  });

  it('gives values for state "registered" if only 1 resource', () => {
    const result = resultForState(Resource.registered);
    expect(result.type).to.be('unsubscribe');
    expect(result.displayText).to.equal('activities.unsubscribe_single');
  });

  it('gives values for state "registrationPossible"', () => {
    const result = resultForState(Resource.registrationPossible);
    expect(result.type).to.be('subscribe');
    expect(result.displayText).to.equal('activities.subscribe_single');
  });

  it('gives values for state "registrationElsewhere"', () => {
    const result = resultForState(Resource.registrationElsewhere);
    expect(result.type).to.not.exist();
    expect(result.displayText).to.equal('activities.registration_not_here');
  });

  it('gives values for state "registrationClosed"', () => {
    const result = resultForState(Resource.registrationClosed);
    expect(result.type).to.not.exist();
    expect(result.displayText).to.equal('activities.registration_not_now');
  });

  it('gives values for state "waitinglistPossible"', () => {
    const result = resultForState(Resource.waitinglistPossible);
    expect(result.type).to.be('addToWaitinglist');
    expect(result.displayText).to.equal('activities.add_to_waitinglist');
  });

  it('gives values for state "onWaitinglist"', () => {
    const result = resultForState(Resource.onWaitinglist);
    expect(result.type).to.be('removeFromWaitinglist');
    expect(result.displayText).to.equal('activities.remove_from_waitinglist');
  });

  it('gives values for state "full"', () => {
    const result = resultForState(Resource.full);
    expect(result.type).to.not.exist();
    expect(result.displayText).to.equal('activities.full');
  });

});

describe('Resource', () => {

  describe('rendering cases with existing user', () => {
    it('indicates to render the "leave" button if the user is registered and "unsubscription possible"', () => {
      const resource = new Resource({
        _registeredMembers: [
          {memberId: 'memberID'}
        ]
      });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registered);
    });

    it('indicates to render the "leave" button if the user is registered and "unsubscription not possible"', () => {
      const resource = new Resource({
        _registeredMembers: [
          {memberId: 'memberID'}
        ], _canUnsubscribe: false
      });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.fixed);
    });

    it('indicates to render the "enter" button if registration is possible', () => {
      const resource = new Resource({_registrationOpen: true});
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registrationPossible);
    });

    it('indicates to render that registration is not possible if limit is zero', () => {
      const resource = new Resource({_registrationOpen: true, _limit: 0});
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registrationElsewhere);
    });

    it('indicates to render that registration is currently not possible if registration is closed and there is no limit', () => {
      const resource = new Resource({_registrationOpen: false});
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registrationClosed);
    });

    it('indicates to render that registration is currently not possible if registration is closed and there is a limit', () => {
      const resource = new Resource({_registrationOpen: false, _limit: 2});
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registrationClosed);
    });

    it('indicates to render the "waitinglist" button if registration is closed and there is a limit and there are already registrations', () => {
      const resource = new Resource({
        _registrationOpen: false, _limit: 2, _registeredMembers: [
          {memberId: 'alreadyRegisteredMemberId'}
        ], _waitinglist: []
      });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.waitinglistPossible);
    });

    it('indicates to render the "leave waitinglist" button if registration is closed and there is a limit and there are already registrations', () => {
      const resource = new Resource({
        _registrationOpen: false, _limit: 2, _registeredMembers: [
          {memberId: 'alreadyRegisteredMemberId'}
        ], _waitinglist: [
          {_memberId: 'memberID'}
        ]
      });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.onWaitinglist);
    });

    it('indicates to render that the resource is fully booked', () => {
      const resource = new Resource({
        _registrationOpen: false, _limit: 2, _registeredMembers: [
          {memberId: 'alreadyRegisteredMemberId'}
        ]
      });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.full);
    });
  });

  describe('rendering cases with anonymous user', () => {
    it('indicates to render the "enter" button if registration is possible', () => {
      const resource = new Resource({_registrationOpen: true});
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.registrationPossible);
    });

    it('indicates to render that registration is not possible if limit is zero', () => {
      const resource = new Resource({_registrationOpen: true, _limit: 0});
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.registrationElsewhere);
    });

    it('indicates to render that registration is currently not possible if registration is closed and there is no limit', () => {
      const resource = new Resource({_registrationOpen: false});
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.registrationClosed);
    });

    it('indicates to render that registration is currently not possible if registration is closed and there is a limit', () => {
      const resource = new Resource({_registrationOpen: false, _limit: 2});
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.registrationClosed);
    });

    it('indicates to render the "waitinglist" button if registration is closed and there is a limit and there are already registrations', () => {
      const resource = new Resource({
        _registrationOpen: false, _limit: 2, _registeredMembers: [
          {memberId: 'alreadyRegisteredMemberId'}
        ], _waitinglist: []
      });
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.waitinglistPossible);
    });

    it('indicates to render that the resource is fully booked', () => {
      const resource = new Resource({
        _registrationOpen: false, _limit: 2, _registeredMembers: [
          {memberId: 'alreadyRegisteredMemberId'}
        ]
      });
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.full);
    });
  });

});
