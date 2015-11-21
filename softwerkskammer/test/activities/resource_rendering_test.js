'use strict';

var expect = require('must-dist');
var sinon = require('sinon').sandbox.create();

var beans = require('../../testutil/configureForTest').get('beans');
var Resource = beans.get('resource');
var resourceRegistrationRenderer = beans.get('resourceRegistrationRenderer');
var Activity = beans.get('activity');

describe('ResourceRegistrationRenderer', function () {
  var resource = new Resource({});
  var activity = new Activity({});
  var resourceNamesList;

  function resultForState(state) {
    sinon.stub(resource, 'registrationStateFor', function () { return state; });
    return resourceRegistrationRenderer.htmlRepresentationOf(activity, 'resourceName');
  }

  beforeEach(function () {
    resourceNamesList = [ 'name1' ];
    sinon.stub(activity, 'resourceNamed', function () { return resource; });
    sinon.stub(activity, 'resourceNames', function () { return resourceNamesList; });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('gives values for state "fixed"', function () {
    var result = resultForState(Resource.fixed);
    expect(result.type).to.not.exist();
    expect(result.displayText).to.equal('activities.unsubscribe_not_possible');
  });

  it('gives values for state "registered" if only 1 resource', function () {
    var result = resultForState(Resource.registered);
    expect(result.type).to.be('unsubscribe');
    expect(result.displayText).to.equal('activities.unsubscribe_single');
  });

  it('gives different values for state "registered" if more than 1 resource', function () {
    resourceNamesList.push('name2');
    var result = resultForState(Resource.registered);
    expect(result.type).to.be('unsubscribe');
    expect(result.displayText).to.equal('activities.unsubscribe_multiple');
  });

  it('gives values for state "registrationPossible" if only 1 resource', function () {
    var result = resultForState(Resource.registrationPossible);
    expect(result.type).to.be('subscribe');
    expect(result.displayText).to.equal('activities.subscribe_single');
  });

  it('gives different values for state "registrationPossible" if more than 1 resource', function () {
    resourceNamesList.push('name2');
    var result = resultForState(Resource.registrationPossible);
    expect(result.type).to.be('subscribe');
    expect(result.displayText).to.equal('activities.subscribe_multiple');
  });

  it('gives values for state "registrationElsewhere"', function () {
    var result = resultForState(Resource.registrationElsewhere);
    expect(result.type).to.not.exist();
    expect(result.displayText).to.equal('activities.registration_not_here');
  });

  it('gives values for state "registrationClosed"', function () {
    var result = resultForState(Resource.registrationClosed);
    expect(result.type).to.not.exist();
    expect(result.displayText).to.equal('activities.registration_not_now');
  });

  it('gives values for state "waitinglistPossible"', function () {
    var result = resultForState(Resource.waitinglistPossible);
    expect(result.type).to.be('addToWaitinglist');
    expect(result.displayText).to.equal('activities.add_to_waitinglist');
  });

  it('gives values for state "onWaitinglist"', function () {
    var result = resultForState(Resource.onWaitinglist);
    expect(result.type).to.be('removeFromWaitinglist');
    expect(result.displayText).to.equal('activities.remove_from_waitinglist');
  });

  it('gives values for state "full"', function () {
    var result = resultForState(Resource.full);
    expect(result.type).to.not.exist();
    expect(result.displayText).to.equal('activities.full');
  });

});

describe('Resource', function () {

  describe('rendering cases with existing user', function () {
    it('indicates to render the "leave" button if the user is registered and "unsubscription possible"', function () {
      var resource = new Resource({ _registeredMembers: [
        {memberId: 'memberID'}
      ]});
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registered);
    });

    it('indicates to render the "leave" button if the user is registered and "unsubscription not possible"', function () {
      var resource = new Resource({ _registeredMembers: [
        {memberId: 'memberID'}
      ], _canUnsubscribe: false});
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.fixed);
    });

    it('indicates to render the "enter" button if registration is possible', function () {
      var resource = new Resource({ _registrationOpen: true });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registrationPossible);
    });

    it('indicates to render that registration is not possible if limit is zero', function () {
      var resource = new Resource({ _registrationOpen: true, _limit: 0 });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registrationElsewhere);
    });

    it('indicates to render that registration is currently not possible if registration is closed and there is no limit', function () {
      var resource = new Resource({ _registrationOpen: false });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registrationClosed);
    });

    it('indicates to render that registration is currently not possible if registration is closed and there is a limit', function () {
      var resource = new Resource({ _registrationOpen: false, _limit: 2 });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registrationClosed);
    });

    it('indicates to render the "waitinglist" button if registration is closed and there is a limit and there are already registrations', function () {
      var resource = new Resource({ _registrationOpen: false, _limit: 2, _registeredMembers: [
        {memberId: 'alreadyRegisteredMemberId'}
      ], _waitinglist: [] });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.waitinglistPossible);
    });

    it('indicates to render the "leave waitinglist" button if registration is closed and there is a limit and there are already registrations', function () {
      var resource = new Resource({ _registrationOpen: false, _limit: 2, _registeredMembers: [
        {memberId: 'alreadyRegisteredMemberId'}
      ], _waitinglist: [
        {_memberId: 'memberID'}
      ] });
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.onWaitinglist);
    });

    it('indicates to render that the resource is fully booked', function () {
      var resource = new Resource({ _registrationOpen: false, _limit: 2, _registeredMembers: [
        {memberId: 'alreadyRegisteredMemberId'}
      ]});
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.full);
    });
  });

  describe('rendering cases with anonymous user', function () {
    it('indicates to render the "enter" button if registration is possible', function () {
      var resource = new Resource({ _registrationOpen: true });
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.registrationPossible);
    });

    it('indicates to render that registration is not possible if limit is zero', function () {
      var resource = new Resource({ _registrationOpen: true, _limit: 0 });
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.registrationElsewhere);
    });

    it('indicates to render that registration is currently not possible if registration is closed and there is no limit', function () {
      var resource = new Resource({ _registrationOpen: false });
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.registrationClosed);
    });

    it('indicates to render that registration is currently not possible if registration is closed and there is a limit', function () {
      var resource = new Resource({ _registrationOpen: false, _limit: 2 });
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.registrationClosed);
    });

    it('indicates to render the "waitinglist" button if registration is closed and there is a limit and there are already registrations', function () {
      var resource = new Resource({ _registrationOpen: false, _limit: 2, _registeredMembers: [
        {memberId: 'alreadyRegisteredMemberId'}
      ], _waitinglist: [] });
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.waitinglistPossible);
    });

    it('indicates to render that the resource is fully booked', function () {
      var resource = new Resource({ _registrationOpen: false, _limit: 2, _registeredMembers: [
        {memberId: 'alreadyRegisteredMemberId'}
      ]});
      expect(resource.registrationStateFor(undefined)).to.equal(Resource.full);
    });
  });

});
