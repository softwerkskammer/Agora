"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;
var sinon = require('sinon').sandbox.create();

var beans = conf.get('beans');
var Resource = beans.get('resource');
var resourceRegistrationRenderer = beans.get('resourceRegistrationRenderer');
var Activity = beans.get('activity');

describe('ResourceRegistrationRenderer', function () {
  var resource = new Resource({});
  var activity = new Activity({});
  var resourceNamesList;
  
  function resultForState(state) {
    sinon.stub(resource, 'registrationStateFor', function () { return  state; });
    return resourceRegistrationRenderer.htmlRepresentationOf(activity, 'resourceName');
  }

  beforeEach(function () {
    resourceNamesList = [ 'name1' ];
    sinon.stub(activity, 'resourceNamed', function () { return resource; });
    sinon.stub(activity, 'url', function () { return 'URL'; });
    sinon.stub(activity, 'resourceNames', function () { return resourceNamesList; });
  });

  afterEach(function () {
    sinon.restore();
  });

  it('gives values for state "registered" if only 1 resource', function () {
    var result = resultForState(Resource.registered);
    expect(result.url).to.match(/^unsubscribe/);
    expect(result.displayText).to.equal('Ich kann doch nicht…');
  });

  it('gives different values for state "registered" if more than 1 resource', function () {
    resourceNamesList.push('name2');
    var result = resultForState(Resource.registered);
    expect(result.url).to.match(/^unsubscribe/);
    expect(result.displayText).to.equal('Absagen');
  });

  it('gives values for state "registrationPossible" if only 1 resource', function () {
    var result = resultForState(Resource.registrationPossible);
    expect(result.url).to.match(/^subscribe/);
    expect(result.displayText).to.equal('Ich bin dabei!');
  });

  it('gives different values for state "registrationPossible" if more than 1 resource', function () {
    resourceNamesList.push('name2');
    var result = resultForState(Resource.registrationPossible);
    expect(result.url).to.match(/^subscribe/);
    expect(result.displayText).to.equal('Anmelden');
  });

  it('gives values for state "registrationElsewhere"', function () {
    var result = resultForState(Resource.registrationElsewhere);
    expect(result.url).to.not.exist;
    expect(result.displayText).to.equal('Anmeldung ist nicht über die Softwerkskammer möglich.');
  });

  it('gives values for state "registrationClosed"', function () {
    var result = resultForState(Resource.registrationClosed);
    expect(result.url).to.not.exist;
    expect(result.displayText).to.equal('Anmeldung ist zur Zeit nicht möglich.');
  });

  it('gives values for state "waitinglistPossible"', function () {
    var result = resultForState(Resource.waitinglistPossible);
    expect(result.url).to.match(/^addToWai/);
    expect(result.displayText).to.equal('Auf die Warteliste!');
  });

  it('gives values for state "onWaitinglist"', function () {
    var result = resultForState(Resource.onWaitinglist);
    expect(result.url).to.match(/^removeFromWai/);
    expect(result.displayText).to.equal('Warteliste verlassen…');
  });

  it('gives values for state "full"', function () {
    var result = resultForState(Resource.full);
    expect(result.url).to.not.exist;
    expect(result.displayText).to.equal('Alle Plätze sind belegt.');
  });

});

describe('Resource', function () {

  describe('rendering cases with existing user', function () {
    it('indicates to render the "leave" button if the user is registered', function () {
      var resource = new Resource({ _registeredMembers: [
        {memberId: 'memberID'}
      ]});
      expect(resource.registrationStateFor('memberID')).to.equal(Resource.registered);
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
