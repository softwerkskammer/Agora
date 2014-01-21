"use strict";

require('../configureForTest');
var moment = require('moment-timezone');
var conf = require('nconf');
var expect = require('chai').expect;

var beans = conf.get('beans');
var Resource = beans.get('resource');
var Activity = beans.get('activity');

describe('Resource', function () {
  describe('registration matters', function () {
    it('can add a member', function () {
      var resource = new Resource({ });
      resource.addMemberId('memberID');
      expect(resource.registeredMembers()).to.contain('memberID');
    });

    it('disables registration once full', function () {
      var resource = new Resource({
        _registeredMembers: [
          {memberId: 'memberID'}
        ],
        _limit: 2,
        _registrationOpen: true
      });
      expect(resource.isRegistrationOpen()).to.be.true;
      resource.addMemberId('memberID1');
      expect(resource.registeredMembers().length).to.equal(2);
      expect(resource.isRegistrationOpen()).to.be.false;
    });

    it('does not add a member twice', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ]});
      resource.addMemberId('memberID');
      expect(resource.registeredMembers().length).to.equal(1);
    });

    it('removes a member from the waitinglist when registering', function () {
      var resource = new Resource({_waitinglist: [
        {_memberId: 'memberID'}
      ]});
      expect(resource.waitinglistEntries().length).to.equal(1);
      resource.addMemberId('memberID');
      expect(resource.registeredMembers().length).to.equal(1);
      expect(resource.waitinglistEntries().length).to.equal(0);
    });

    it('can remove a registered member', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ]});
      resource.removeMemberId('memberID');
      expect(resource.registeredMembers()).to.be.empty;
    });

    it('does not change the registration state when removing a member', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ],
        _limit: 1,
        _registrationOpen: false
      });
      resource.removeMemberId('memberID');
      expect(resource.isFull()).to.be.false;
      expect(resource.isRegistrationOpen()).to.be.false;
    });

    it('can remove member even when empty', function () {
      var resource = new Resource();
      resource.removeMemberId('notRegisteredID');
      expect(resource.registeredMembers()).to.be.empty;
    });

    it('is not full when it does not contain any members', function () {
      var resource = new Resource();
      expect(resource.isFull()).to.be.false;
    });

    it('with one spot is full when one member is registered', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ], _limit: 1});
      expect(resource.isFull()).to.be.true;
    });

    it('with one spot does not accept member registrations when one member is registered', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ], _limit: 1});
      resource.addMemberId('otherMemberID');
      expect(resource.registeredMembers().length).to.equal(1);
      expect(resource.registeredMembers()).to.contain('memberID');
    });
  });

  describe('- when copying -', function () {

    it('resets the registered members and keeps the original members', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ], _limit: 1});
      var copy = new Resource({}).copyFrom(resource);
      expect(resource.registeredMembers()).to.not.be.empty;
      expect(copy.registeredMembers()).to.be.empty;
    });

    it('does not change the registered members of the copy when a member is added to the original', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ], _limit: 1});
      var copy = new Resource({}).copyFrom(resource);
      resource.addMemberId('memberID2');
      expect(resource.registeredMembers()).to.not.be.empty;
      expect(copy.registeredMembers()).to.be.empty;
    });

    it('copies the limit', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ], _limit: 1});
      var copy = new Resource({}).copyFrom(resource);
      expect(copy.limit()).to.equal(1);
    });

    it('opens the registration for the copy', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ], _limit: 1});
      var copy = new Resource({}).copyFrom(resource);
      expect(copy.isRegistrationOpen()).to.be.true;
    });

    it('opens the registration for the copy even when it was not open for the original', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ], _limit: 1, _registrationOpen: false});
      var copy = new Resource({}).copyFrom(resource);
      expect(copy.isRegistrationOpen()).to.be.true;
    });

    it('sets the waitinglist preference for the copy to false', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ]});
      var copy = new Resource({}).copyFrom(resource);
      expect(copy.hasWaitinglist()).to.be.false;
    });

    it('sets the waitinglist preference for the copy to false even when it was true for the original', function () {
      var resource = new Resource({_registeredMembers: [
        {memberId: 'memberID'}
      ], _withWaitinglist: true});
      var copy = new Resource({}).copyFrom(resource);
      expect(copy.hasWaitinglist()).to.be.false;
    });

  });

  describe("(fillFromUI)", function () {

    it("adds a limit if it is given", function () {
      var resource = new Resource();
      resource.fillFromUI({limit: "10"});
      expect(resource.limit()).to.equal(10);
    });

    it("removes a limit if it is not given", function () {
      var resource = new Resource({ limit: 10 });
      resource.fillFromUI({limit: ""});
      expect(resource.limit()).to.be.undefined;
    });

    it("allows registration if it is indicated", function () {
      var resource = new Resource();
      resource.fillFromUI({isRegistrationOpen: "true"});
      expect(resource.isRegistrationOpen()).to.be.true;
    });

    it("removes 'registration allowed' if it is not indicated", function () {
      var resource = new Resource({ _registrationOpen: true });
      resource.fillFromUI({isRegistrationOpen: ""});
      expect(resource.isRegistrationOpen()).to.be.false;
    });

    it("adds a waitinglist if it is indicated", function () {
      var resource = new Resource();
      resource.fillFromUI({hasWaitinglist: "someValue"});
      expect(resource.hasWaitinglist()).to.be.true;
    });

    it("removes 'with waitinglist' if it is not indicated", function () {
      var resource = new Resource({ _withWaitinglist: true });
      resource.fillFromUI({hasWaitinglist: ""});
      expect(resource.hasWaitinglist()).to.be.false;
    });

  });

  describe('- canSubscribe -', function () {
    var activity1;
    beforeEach(function () {
      activity1 = new Activity({id: "Meine Aktivität", url: "myActivity", resources: {"Meine Ressource": {_waitinglist: []}}});
    });

    it('does not allow to subscribe if the registration is not allowed for the waiting list member', function () {
      var resource = activity1.resourceNamed("Meine Ressource");
      resource.addToWaitinglist('12345', moment());
      resource.waitinglistEntryFor('12345').setRegistrationValidityFor();

      expect(resource.waitinglistEntryFor('12345').canSubscribe()).to.be.false;
    });

    it('does not allow to subscribe if the registration timeslot is already past', function () {
      var resource = activity1.resourceNamed("Meine Ressource");
      resource.addToWaitinglist('12345', moment());
      resource.waitinglistEntryFor('12345').setRegistrationValidityFor('-1');

      expect(resource.waitinglistEntryFor('12345').canSubscribe()).to.be.false;
    });

    it('allows to subscribe if the end of the registration timeslot is not reached yet', function () {
      var resource = activity1.resourceNamed("Meine Ressource");
      resource.addToWaitinglist('12345', moment());
      resource.waitinglistEntryFor('12345').setRegistrationValidityFor('1');

      expect(resource.waitinglistEntryFor('12345').canSubscribe()).to.be.true;
    });

    it('does not add a member to waitinglist if this member is already registered', function () {
      var resource = activity1.resourceNamed("Meine Ressource");
      resource.addMemberId('12345');
      expect(resource.isAlreadyRegistered('12345')).to.be.true;
      resource.addToWaitinglist('12345', moment());
      
      expect(resource.waitinglistEntryFor('12345')).to.not.exist;
    });
  });

});
