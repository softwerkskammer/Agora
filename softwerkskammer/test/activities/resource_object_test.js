"use strict";

const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const Resource = beans.get("resource");
const Activity = beans.get("activity");

const tomorrow = new Date(Date.now() + 86400000); // 1 day as millis

describe("Resource", () => {
  describe("registration matters", () => {
    it("can add a member", () => {
      const resource = new Resource({ _registrationOpen: true });
      const result = resource.addMemberId("memberID");

      expect(result).to.be(true);
      expect(resource.registeredMembers()).to.contain("memberID");
    });

    it("disables registration once full", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 2,
        _registrationOpen: true,
      });
      expect(resource.isRegistrationOpen()).to.be(true);
      const result = resource.addMemberId("memberID1");
      expect(result).to.be(true);
      expect(resource.registeredMembers().length).to.equal(2);
      expect(resource.isRegistrationOpen()).to.be(false);
    });

    it("does not add a member twice", () => {
      const resource = new Resource({
        _registrationOpen: true,
        _registeredMembers: [{ memberId: "memberID" }],
      });
      const result = resource.addMemberId("memberID");
      expect(result).to.be(true);
      expect(resource.registeredMembers().length).to.equal(1);
    });

    it("removes a member from the waitinglist when registering", () => {
      const resource = new Resource({
        _registrationOpen: true,
        _waitinglist: [{ _memberId: "memberID" }],
      });
      expect(resource.waitinglistEntries().length).to.equal(1);
      const result = resource.addMemberId("memberID");
      expect(result).to.be(true);
      expect(resource.registeredMembers().length).to.equal(1);
      expect(resource.waitinglistEntries().length).to.equal(0);
    });

    it("can remove a registered member", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
      });
      resource.removeMemberId("memberID");
      expect(resource.registeredMembers()).to.be.empty();
    });

    it("does not change the registration state when removing a member", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 1,
        _registrationOpen: false,
      });
      resource.removeMemberId("memberID");
      expect(resource.isFull()).to.be(false);
      expect(resource.isRegistrationOpen()).to.be(false);
    });

    it("can remove member even when empty", () => {
      const resource = new Resource();
      resource.removeMemberId("notRegisteredID");
      expect(resource.registeredMembers()).to.be.empty();
    });

    it("is not full when it does not contain any members", () => {
      const resource = new Resource();
      expect(resource.isFull()).to.be(false);
    });

    it("with one spot is full when one member is registered", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 1,
      });
      expect(resource.isFull()).to.be(true);
    });

    it("with one spot does not accept member registrations when one member is registered", () => {
      const resource = new Resource({
        _registrationOpen: true,
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 1,
      });
      const result = resource.addMemberId("otherMemberID");
      expect(result).to.be(false);
      expect(resource.registeredMembers().length).to.equal(1);
      expect(resource.registeredMembers()).to.contain("memberID");
    });

    it("does not accept member registration when registration is not open", () => {
      const resource = new Resource({
        _registrationOpen: false,
      });
      const result = resource.addMemberId("memberID");
      expect(result).to.be(false);
      expect(resource.registeredMembers().length).to.equal(0);
    });

    it("allows somebody on the waitinglist to subscribe although it is full and registration is not open", () => {
      const resource = new Resource({
        _registrationOpen: false,
        _limit: 1,
        _registeredMembers: [{ memberId: "otherMemberID" }],
        _waitinglist: [
          {
            _memberId: "memberID",
            _registrationValidUntil: tomorrow,
          },
        ],
      });
      const result = resource.addMemberId("memberID");
      expect(result).to.be(true);
      expect(resource.registeredMembers().length).to.equal(2);
      expect(resource.registeredMembers()).to.contain("memberID");
      expect(resource.waitinglistEntries().length).to.equal(0);
    });
  });

  describe("- when copying -", () => {
    it("resets the registered members and keeps the original members", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 1,
      });
      const copy = new Resource({}).copyFrom(resource);
      expect(resource.registeredMembers()).to.not.be.empty();
      expect(copy.registeredMembers()).to.be.empty();
    });

    it("does not change the registered members of the copy when a member is added to the original", () => {
      const resource = new Resource({
        _registrationOpen: true,
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 2,
      });
      const copy = new Resource({}).copyFrom(resource);
      const result = resource.addMemberId("memberID2");
      expect(result).to.be(true);
      expect(resource.registeredMembers()).to.have.length(2);
      expect(copy.registeredMembers()).to.be.empty();
    });

    it("copies the limit", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 1,
      });
      const copy = new Resource({}).copyFrom(resource);
      expect(copy.limit()).to.equal(1);
    });

    it("opens the registration for the copy", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 1,
      });
      const copy = new Resource({}).copyFrom(resource);
      expect(copy.isRegistrationOpen()).to.be(true);
    });

    it("opens the registration for the copy even when it was not open for the original", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
        _limit: 1,
        _registrationOpen: false,
      });
      const copy = new Resource({}).copyFrom(resource);
      expect(copy.isRegistrationOpen()).to.be(true);
    });

    it("sets the waitinglist preference for the copy to false", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
      });
      const copy = new Resource({}).copyFrom(resource);
      expect(copy.hasWaitinglist()).to.be(false);
    });

    it("sets the waitinglist preference for the copy to false even when it was true for the original", () => {
      const resource = new Resource({
        _registeredMembers: [{ memberId: "memberID" }],
        _withWaitinglist: true,
      });
      const copy = new Resource({}).copyFrom(resource);
      expect(copy.hasWaitinglist()).to.be(false);
    });
  });

  describe("(fillFromUI)", () => {
    it("adds a limit if it is given", () => {
      const resource = new Resource();
      resource.fillFromUI({ limit: "10" });
      expect(resource.limit()).to.equal(10);
    });

    it("removes a limit if it is not given", () => {
      const resource = new Resource({ limit: 10 });
      resource.fillFromUI({ limit: "" });
      expect(resource.limit()).to.be(undefined);
    });

    it("allows registration if it is indicated", () => {
      const resource = new Resource();
      resource.fillFromUI({ isRegistrationOpen: "yes" });
      expect(resource.isRegistrationOpen()).to.be(true);
    });

    it('removes "registration allowed" if it is not indicated', () => {
      const resource = new Resource({ _registrationOpen: true });
      resource.fillFromUI({ isRegistrationOpen: "no" });
      expect(resource.isRegistrationOpen()).to.be(false);
    });

    it("allows unsubscription if it is indicated", () => {
      const resource = new Resource();
      resource.fillFromUI({ canUnsubscribe: "yes" });
      expect(resource.canUnsubscribe()).to.be(true);
    });

    it("disallows unsubscription if it is indicated", () => {
      const resource = new Resource({ _canUnsubscribe: true });
      resource.fillFromUI({ canUnsubscribe: "no" });
      expect(resource.canUnsubscribe()).to.be(false);
    });

    it("defaults unsubscription to true if not set", () => {
      const resource = new Resource();
      expect(resource.canUnsubscribe()).to.be(true);
    });

    it("adds a waitinglist if it is indicated", () => {
      const resource = new Resource();
      resource.fillFromUI({ hasWaitinglist: "yes" });
      expect(resource.hasWaitinglist()).to.be(true);
    });

    it('removes "with waitinglist" if it is not indicated', () => {
      const resource = new Resource({ _withWaitinglist: true });
      resource.fillFromUI({ hasWaitinglist: "no" });
      expect(resource.hasWaitinglist()).to.be(false);
    });
  });

  describe("- canSubscribe -", () => {
    let activity1;
    beforeEach(() => {
      activity1 = new Activity({
        id: "Meine Aktivität",
        url: "myActivity",
        resources: { Veranstaltung: { _registrationOpen: true, _waitinglist: [] } },
      });
    });

    it("does not allow to subscribe if the registration is not allowed for the waiting list member", () => {
      const resource = activity1.resourceNamed("Veranstaltung");
      resource.addToWaitinglist("12345", Date.now());
      resource.waitinglistEntryFor("12345").setRegistrationValidityFor();

      expect(resource.waitinglistEntryFor("12345").canSubscribe()).to.be(false);
    });

    it("does not allow to subscribe if the registration timeslot is already past", () => {
      const resource = activity1.resourceNamed("Veranstaltung");
      resource.addToWaitinglist("12345", Date.now());
      resource.waitinglistEntryFor("12345").setRegistrationValidityFor("-1");

      expect(resource.waitinglistEntryFor("12345").canSubscribe()).to.be(false);
    });

    it("allows to subscribe if the end of the registration timeslot is not reached yet", () => {
      const resource = activity1.resourceNamed("Veranstaltung");
      resource.addToWaitinglist("12345", Date.now());
      resource.waitinglistEntryFor("12345").setRegistrationValidityFor("1");

      expect(resource.waitinglistEntryFor("12345").canSubscribe()).to.be(true);
    });

    it("does not add a member to waitinglist if this member is already registered", () => {
      const resource = activity1.resourceNamed("Veranstaltung");
      resource.addMemberId("12345");

      expect(resource.isAlreadyRegistered("12345")).to.be(true);
      resource.addToWaitinglist("12345", Date.now());

      expect(resource.waitinglistEntryFor("12345")).to.not.exist();
    });
  });

  describe("- registration date -", () => {
    let resource;
    beforeEach(() => {
      resource = new Resource({ _registrationOpen: true });
    });

    it("returns undefined if the member is not registered", () => {
      expect(resource.registrationDateOf("12345")).to.be(undefined);
    });

    it("returns the registration date if the member is registered", () => {
      const millisOfRegistration = new Date("2014-03-03").getTime();
      resource.addMemberId("12345", millisOfRegistration);

      expect(resource.registrationDateOf("12345")).to.eql(new Date(millisOfRegistration));
    });
  });
});
