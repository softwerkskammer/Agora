"use strict";

require("../../testutil/configureForTest");

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const activitiesService = require("../../lib/activities/activitiesService");
const activitystore = require("../../lib/activities/activitystore");
const groupsService = require("../../lib/groups/groupsService");
const groupstore = require("../../lib/groups/groupstore");
const memberstore = require("../../lib/members/memberstore");
const membersService = require("../../lib/members/membersService");

const Activity = require("../../lib/activities/activity");
const Member = require("../../lib/members/member");
const Group = require("../../lib/groups/group");
const notifications = require("../../lib/notifications");

const dummyActivity = new Activity({
  title: "Title of the Activity",
  description: "description",
  assignedGroup: "assignedGroup",
  location: "location",
  direction: "direction",
  startDate: "01.01.2013",
  url: "urlOfTheActivity",
  color: "aus Gruppe",
});

const group = new Group({ id: "groupname", longName: "Buxtehude" });

function waitinglistMembersOf(activity) {
  /* eslint no-underscore-dangle: 0 */
  return activity
    .allWaitinglistEntries()
    .map((entry) => entry.state)
    .map((state) => state._memberId);
}

function activityWithEinzelzimmer(ressource) {
  const state = { resources: { Veranstaltung: ressource } };
  const activity = new Activity(state);
  sinon.stub(activitystore, "saveActivity");
  sinon.stub(activitystore, "getActivity").returns(activity);
  sinon.stub(activitystore, "getActivityForId").returns(activity);
  return activity;
}

describe("Activities Service", () => {
  beforeEach(() => {
    sinon.stub(activitystore, "allActivities").returns([dummyActivity]);

    sinon.stub(groupstore, "allGroups").returns([{ id: "assignedGroup", longName: "The name of the assigned Group" }]);
    sinon.stub(groupsService, "allGroupColors").returns({ assignedGroup: "#123456" });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns the queried activities and enhances them with their color and group name", () => {
    const activities = activitiesService.getActivitiesForDisplay(activitystore.allActivities);
    expect(activities.length).to.equal(1);
    const activity = activities[0];
    expect(activity.title()).to.equal("Title of the Activity");
    expect(activity.colorRGB).to.equal("#123456");
    expect(activity.groupName()).to.equal("The name of the assigned Group");
  });

  it("returns an activity and enhances it with its group and visitors", () => {
    const member1 = new Member({
      id: "memberId1",
      nickname: "participant1",
      email: "nick1@b.c",
      firstname: "Firstname1",
      lastname: "Lastname1",
    });
    const member2 = new Member({
      id: "memberId2",
      nickname: "participant2",
      email: "nick2@b.c",
      firstname: "Firstname2",
      lastname: "Lastname2",
    });
    const owner = new Member({ id: "ownerId", nickname: "owner", email: "a@b.c" });

    const emptyActivity = new Activity({
      title: "Title of the Activity",
      url: "urlOfTheActivity",
      assignedGroup: "groupname",
      owner: "ownerId",
    });

    sinon.stub(activitystore, "getActivity").returns(emptyActivity);
    sinon.stub(memberstore, "getMembersForIds").callsFake(() => {
      const memberA = new Member({
        id: "memberId1",
        nickname: "participant1",
        email: "nick1@b.c",
        firstname: "Firstname1",
        lastname: "Lastname1",
      });
      const memberB = new Member({
        id: "memberId2",
        nickname: "participant2",
        email: "nick2@b.c",
        firstname: "Firstname2",
        lastname: "Lastname2",
      });

      return [memberA, memberB];
    });
    sinon.stub(membersService, "putAvatarIntoMemberAndSave");
    sinon.stub(memberstore, "getMemberForId").returns(owner);
    sinon.stub(groupstore, "getGroup").callsFake((groupname) => {
      if (groupname === "groupname") {
        return group;
      }
      return null;
    });

    const expectedActivity = new Activity({
      title: "Title of the Activity",
      url: "urlOfTheActivity",
      assignedGroup: "groupname",
      owner: "ownerId",
    });

    // following are the expected enrichements of the activity
    expectedActivity.group = group;
    expectedActivity.participants = [member1, member2];
    expectedActivity.ownerNickname = "owner";

    const activity = activitiesService.getActivityWithGroupAndParticipants("urlOfTheActivity");
    expect(activity, "Activity").to.exist();
    expect(activity.group, "Group").to.equal(group);
    expect(activity.participants.length).to.equal(2);
    expect(activity.ownerNickname, "Owner").to.equal("owner");
    const partsIDs = activity.participants.map((p) => p.id());
    expect(partsIDs, "Participants").to.contain(member1.id());
    expect(partsIDs, "Participants").to.contain(member2.id());
  });

  describe("checks the validity of URLs and", () => {
    it("does not allow the URL 'edit'", () => {
      const result = activitiesService.isValidUrl("edit", "^edit$");
      expect(result).to.be(false);
    });

    it("allows the untrimmed URL 'uhu'", () => {
      sinon.stub(activitystore, "getActivity").returns(null);
      const result = activitiesService.isValidUrl(" edit ", "^edit$");
      expect(result).to.be(true);
    });

    it('does not allow a URL containing a "/"', () => {
      const result = activitiesService.isValidUrl("", "^legal/egal");
      expect(result).to.be(false);
    });
  });

  describe("- when adding a visitor -", () => {
    beforeEach(() => {
      sinon.stub(activitystore, "saveActivity");
      sinon.stub(notifications, "visitorRegistration");
    });

    function activityWithAddMemberIdReturning(truthValue) {
      return { addMemberId: () => truthValue };
    }

    it("does not show a status message when member addition succeeds", async () => {
      sinon.stub(activitystore, "getActivity").returns(activityWithAddMemberIdReturning(true));

      const [statusTitle, statusText] = await activitiesService.addVisitorTo("memberId", "activity-url", Date.now());
      expect(statusTitle).to.not.exist();
      expect(statusText).to.not.exist();
    });

    it("shows a status message when member addition fails", async () => {
      sinon.stub(activitystore, "getActivity").returns(activityWithAddMemberIdReturning(false));

      const [statusTitle, statusText] = await activitiesService.addVisitorTo("memberId", "activity-url", Date.now());
      expect(statusTitle).to.be("activities.registration_not_now");
      expect(statusText).to.be("activities.registration_not_possible");
    });

    it("notifies of the registration when member addition succeeds", async () => {
      const activity = activityWithAddMemberIdReturning(true);
      sinon.stub(activitystore, "getActivity").returns(activity);

      await activitiesService.addVisitorTo("memberId", "activity-url", Date.now());
      expect(notifications.visitorRegistration.calledOnce).to.be(true);
      expect(notifications.visitorRegistration.firstCall.args[0]).to.eql(activity);
      expect(notifications.visitorRegistration.firstCall.args[1]).to.equal("memberId");
    });

    it("does not notify of the registration when member addition fails", async () => {
      sinon.stub(activitystore, "getActivity").returns(activityWithAddMemberIdReturning(false));

      await activitiesService.addVisitorTo("memberId", "activity-url", Date.now());
      expect(notifications.visitorRegistration.called).to.be(false);
    });

    it("gives an error when activity could not be loaded", async () => {
      sinon.stub(activitystore, "getActivity").throws(new Error("error"));

      try {
        await activitiesService.addVisitorTo("memberId", "activity-url", Date.now());
        expect(true).to.be(false);
      } catch (e) {
        expect(e).to.exist();
      }
    });
  });

  describe("- when removing a visitor -", () => {
    it("succeeds when registration is open", async () => {
      const activity = activityWithEinzelzimmer({
        _registrationOpen: true,
        _registeredMembers: [{ memberId: "memberId" }, { memberId: "otherId" }],
      });
      sinon.stub(notifications, "visitorUnregistration");

      await activitiesService.removeVisitorFrom("memberId", "activity-url");
      expect(activity.allRegisteredMembers()).to.not.contain("memberId");
      expect(activity.allRegisteredMembers()).to.contain("otherId");
    });

    it("succeeds when registration is not open", async () => {
      const activity = activityWithEinzelzimmer({
        _registrationOpen: false,
        _registeredMembers: [{ memberId: "memberId" }, { memberId: "otherId" }],
      });
      sinon.stub(notifications, "visitorUnregistration");

      await activitiesService.removeVisitorFrom("memberId", "activity-url");
      expect(activity.allRegisteredMembers()).to.not.contain("memberId");
      expect(activity.allRegisteredMembers()).to.contain("otherId");
    });

    it("notifies of the unregistration", async () => {
      const activity = activityWithEinzelzimmer({
        _registrationOpen: true,
        _registeredMembers: [{ memberId: "memberId" }, { memberId: "otherId" }],
      });
      sinon.stub(notifications, "visitorUnregistration");

      await activitiesService.removeVisitorFrom("memberId", "activity-url");
      expect(notifications.visitorUnregistration.calledOnce).to.be(true);
      expect(notifications.visitorUnregistration.firstCall.args[0]).to.eql(activity);
      expect(notifications.visitorUnregistration.firstCall.args[1]).to.equal("memberId");
    });

    it("gives an error when activity could not be loaded", async () => {
      sinon.stub(activitystore, "getActivity").throws(new Error("error"));

      try {
        await activitiesService.removeVisitorFrom("memberId", "activity-url");
        expect(true).to.be(false);
      } catch (e) {
        expect(e, "Error").to.exist();
      }
    });
  });

  describe("- when adding somebody to the waitinglist -", () => {
    it("succeeds when resource has a waitinglist", async () => {
      const activity = activityWithEinzelzimmer({ _waitinglist: [] });
      sinon.stub(notifications, "waitinglistAddition");

      const [statusTitle, statusText] = await activitiesService.addToWaitinglist(
        "memberId",
        "activity-url",
        Date.now(),
      );
      expect(statusTitle, "Status Title").to.not.exist();
      expect(statusText, "Status Text").to.not.exist();
      const waitinglistMembers = waitinglistMembersOf(activity);
      expect(waitinglistMembers).to.contain("memberId");
    });

    it("notifies of the waitinglist addition", async () => {
      const activity = activityWithEinzelzimmer({ _waitinglist: [] });
      sinon.stub(notifications, "waitinglistAddition");

      await activitiesService.addToWaitinglist("memberId", "activity-url", Date.now());
      expect(notifications.waitinglistAddition.calledOnce).to.be(true);
      expect(notifications.waitinglistAddition.firstCall.args[0]).to.eql(activity);
      expect(notifications.waitinglistAddition.firstCall.args[1]).to.equal("memberId");
    });

    it("gives a status message when there is no waitinglist", async () => {
      const activity = activityWithEinzelzimmer({});

      const [statusTitle, statusText] = await activitiesService.addToWaitinglist(
        "memberId",
        "activity-url",
        Date.now(),
      );
      expect(statusTitle, "Status Title").to.equal("activities.waitinglist_not_possible");
      expect(statusText, "Status Text").to.equal("activities.no_waitinglist");
      const waitinglistMembers = waitinglistMembersOf(activity);
      expect(waitinglistMembers).to.not.contain("memberId");
    });

    it("gives an error when activity could not be loaded", async () => {
      sinon.stub(activitystore, "getActivity").throws(new Error("error"));

      try {
        await activitiesService.addToWaitinglist("memberId", "activity-url", Date.now());
        expect(false).to.be(true);
      } catch (e) {
        expect(e, "Error").to.exist();
      }
    });
  });

  describe("- when removing a waitinglist member -", () => {
    it("succeeds no matter whether registration is open or not", async () => {
      const activity = activityWithEinzelzimmer({
        _waitinglist: [{ _memberId: "memberId" }, { _memberId: "otherId" }],
      });
      sinon.stub(notifications, "waitinglistRemoval");

      await activitiesService.removeFromWaitinglist("memberId", "activity-url");
      const waitinglistMembers = waitinglistMembersOf(activity);
      expect(waitinglistMembers).to.not.contain("memberId");
      expect(waitinglistMembers).to.contain("otherId");
    });

    it("notifies of the waitinglist removal", async () => {
      const activity = activityWithEinzelzimmer({
        _registrationOpen: true,
        _registeredMembers: [{ memberId: "memberId" }, { memberId: "otherId" }],
      });
      sinon.stub(notifications, "waitinglistRemoval");

      await activitiesService.removeFromWaitinglist("memberId", "activity-url");
      expect(notifications.waitinglistRemoval.calledOnce).to.be(true);
      expect(notifications.waitinglistRemoval.firstCall.args[0]).to.eql(activity);
      expect(notifications.waitinglistRemoval.firstCall.args[1]).to.equal("memberId");
    });

    it("gives an error when activity could not be loaded", async () => {
      sinon.stub(activitystore, "getActivity").throws(new Error("error"));

      try {
        await activitiesService.removeFromWaitinglist("memberId", "activity-url");
        expect(true).to.be(false);
      } catch (e) {
        expect(e, "Error").to.exist();
      }
    });
  });
});
