"use strict";

require('../configureForTest');
var conf = require('nconf');
var expect = require('chai').expect;

var beans = conf.get('beans');
var Resource = beans.get('resource');

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
