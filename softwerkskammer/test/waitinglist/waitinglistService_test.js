"use strict";

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const beans = require("../../testutil/configureForTest").get("beans");
const waitinglistService = beans.get("waitinglistService");

const activitystore = beans.get("activitystore");
const memberstore = beans.get("memberstore");
const mailsenderService = beans.get("mailsenderService");
const Member = beans.get("member");
const Activity = beans.get("activity");

let activity1;

function waitinglistMembersOf(activity, resourceName) {
  /* eslint no-underscore-dangle: 0 */
  return activity
    .resourceNamed(resourceName)
    .waitinglistEntries()
    .map((entry) => entry.state)
    .map((state) => state._memberId);
}

function activityWithEinzelzimmer(resource) {
  const state = { url: "activity-url", resources: { Veranstaltung: resource } };
  const activity = new Activity(state);
  sinon.stub(activitystore, "getActivity").returns(activity);
  return activity;
}

describe("Waitinglist Service", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("- waitinglist - ", () => {
    beforeEach(() => {
      const member1 = new Member({ id: "12345", nickname: "hansdampf" });
      const member2 = new Member({ id: "abcxyz", nickname: "nickinick" });
      activity1 = new Activity({
        id: "Meine Aktivität",
        url: "myActivity",
        resources: { Veranstaltung: { _waitinglist: [] } },
      });

      sinon.stub(memberstore, "getMemberForId").callsFake((memberId) => {
        if (memberId === member1.id()) {
          return member1;
        }
        if (memberId === member2.id()) {
          return member2;
        }
      });
      sinon.stub(activitystore, "getActivity").returns(activity1);
    });

    it("returns an empty list when the waitinglist is empty", async () => {
      const waitinglist = await waitinglistService.waitinglistFor("myActivity");
      expect(waitinglist).to.be.empty();
    });

    it("returns one entry with its member nickname when the waitinglist contains one entry", async () => {
      activity1.resourceNamed("Veranstaltung").addToWaitinglist("12345", Date.now());

      const waitinglist = await waitinglistService.waitinglistFor("myActivity");
      expect(waitinglist.length).to.equal(1);
      expect(waitinglist[0].registrantNickname).to.equal("hansdampf");
      expect(waitinglist[0].resourceName()).to.equal("Veranstaltung");
      expect(waitinglist[0].registrationDate()).to.not.be(undefined);
      expect(waitinglist[0].registrationValidUntil()).to.be(undefined);
    });

    it("returns two entries with their member nicknames when the waitinglist contains two entries", async () => {
      activity1.resourceNamed("Veranstaltung").addToWaitinglist("12345", Date.now());
      activity1.resourceNamed("Veranstaltung").addToWaitinglist("abcxyz", Date.now());

      const waitinglist = await waitinglistService.waitinglistFor("myActivity");
      expect(waitinglist.length).to.equal(2);
      expect(waitinglist[0].registrantNickname).to.equal("hansdampf");
      expect(waitinglist[1].registrantNickname).to.equal("nickinick");
    });
  });

  describe("- when saving a waitinglist entry -", () => {
    beforeEach(() => undefined);

    it("succeeds no matter whether registration is open or not", async () => {
      activityWithEinzelzimmer({
        _waitinglist: [{ _memberId: "otherId" }],
      });
      let savedActivity;
      sinon.stub(activitystore, "saveActivity").callsFake((activityToSave) => {
        savedActivity = activityToSave;
      });
      sinon.stub(memberstore, "getMember").returns(new Member({ id: "memberId", nickname: "hansdampf" }));

      const args = { nickname: "memberId", activityUrl: "activity-url", resourcename: "Einzelzimmer" };
      await waitinglistService.saveWaitinglistEntry(args);
      const waitinglistMembers = waitinglistMembersOf(savedActivity, "Einzelzimmer");
      expect(waitinglistMembers).to.contain("memberId");
      expect(waitinglistMembers).to.contain("otherId");
    });

    it("gives an error when activity could not be loaded", async () => {
      sinon.stub(activitystore, "getActivity").callsFake((id, callback) => {
        callback(new Error("error"));
      });
      sinon.stub(memberstore, "getMember").returns(new Member({ id: "memberId", nickname: "hansdampf" }));

      const args = { nickname: "memberId", activityUrl: "activity-url", resourcename: "Einzelzimmer" };
      try {
        await waitinglistService.saveWaitinglistEntry(args);
        expect(true).to.be(false);
      } catch (e) {
        expect(e, "Error").to.exist();
      }
    });

    it("gives an error when member could not be loaded", async () => {
      sinon.stub(activitystore, "getActivity").callsFake((id, callback) => {
        callback(null, new Activity());
      });
      sinon.stub(memberstore, "getMember").throws(new Error("error"));

      const args = { nickname: "memberId", activityUrl: "activity-url", resourcename: "Einzelzimmer" };
      try {
        await waitinglistService.saveWaitinglistEntry(args);
        expect(true).to.be(false);
      } catch (e) {
        expect(e, "Error").to.exist();
      }
    });
  });

  describe("- when allowing registration for a waitinglist entry -", () => {
    let mailNotification;

    beforeEach(() => {
      mailNotification = undefined;
      sinon.stub(mailsenderService, "sendRegistrationAllowed").callsFake((member, activity, entry) => {
        mailNotification = { member, activity, entry };
      });
    });

    it("succeeds no matter whether registration is open or not", async () => {
      activityWithEinzelzimmer({
        _waitinglist: [{ _memberId: "memberId" }, { _memberId: "otherId" }],
      });
      let savedActivity;
      sinon.stub(activitystore, "saveActivity").callsFake((activityToSave) => {
        savedActivity = activityToSave;
      });
      sinon.stub(memberstore, "getMember").returns(new Member({ id: "memberId", nickname: "hansdampf" }));

      const args = { nickname: "memberId", activityUrl: "activity-url", resourcename: "Einzelzimmer" };
      await waitinglistService.allowRegistrationForWaitinglistEntry(args);
      const waitinglistMembers = waitinglistMembersOf(savedActivity, "Einzelzimmer");
      expect(waitinglistMembers).to.contain("memberId");
      expect(waitinglistMembers).to.contain("otherId");

      expect(mailNotification.member.id()).to.equal("memberId");
      expect(mailNotification.activity.url()).to.equal("activity-url");
      expect(mailNotification.entry.registrantId()).to.equal("memberId");
    });

    it("gives an error and does not notify when save failed", async () => {
      activityWithEinzelzimmer({
        _waitinglist: [{ _memberId: "memberId" }, { _memberId: "otherId" }],
      });
      sinon.stub(activitystore, "saveActivity").callsFake(() => {
        throw new Error("Some problem during save");
      });
      sinon.stub(memberstore, "getMember").returns(new Member({ id: "memberId", nickname: "hansdampf" }));

      const args = { nickname: "memberId", activityUrl: "activity-url", resourcename: "Einzelzimmer" };
      try {
        await waitinglistService.allowRegistrationForWaitinglistEntry(args);
        expect(true).to.be(false);
      } catch (e) {
        expect(mailNotification, "Notification was not sent").to.be(undefined);
        expect(e, "Error").to.exist();
      }
    });

    it("does not change anything when member is not in waitinglist", async () => {
      const activity = activityWithEinzelzimmer({
        _waitinglist: [{ _memberId: "otherId" }],
      });
      let savedActivity;
      sinon.stub(activitystore, "saveActivity").callsFake((activityToSave) => {
        savedActivity = activityToSave;
      });
      sinon.stub(memberstore, "getMember").returns(new Member({ id: "memberId", nickname: "hansdampf" }));

      const args = { nickname: "memberId", activityUrl: "activity-url", resourcename: "Einzelzimmer" };
      await waitinglistService.allowRegistrationForWaitinglistEntry(args);
      expect(savedActivity, "Activity was not saved").to.be(undefined);
      expect(mailNotification, "Notification was not sent").to.be(undefined);
      const waitinglistMembers = waitinglistMembersOf(activity, "Einzelzimmer");
      expect(waitinglistMembers, "Activity remains unchanged: memberId was not added").to.not.contain("memberId");
      expect(waitinglistMembers, "Activity remains unchanged: otherId is still there").to.contain("otherId");
    });

    it("gives an error when activity could not be loaded", async () => {
      sinon.stub(activitystore, "getActivity").throws(new Error("error"));
      sinon.stub(memberstore, "getMember").returns(new Member({ id: "memberId", nickname: "hansdampf" }));

      const args = { nickname: "memberId", activityUrl: "activity-url", resourcename: "Einzelzimmer" };
      try {
        await waitinglistService.allowRegistrationForWaitinglistEntry(args);
        expect(true).to.be(false);
      } catch (e) {
        expect(mailNotification, "Notification was not sent").to.be(undefined);
        expect(e, "Error").to.exist();
      }
    });

    it("gives an error when member could not be loaded", async () => {
      sinon.stub(activitystore, "getActivity").callsFake((id, callback) => {
        callback(null, new Activity());
      });
      sinon.stub(memberstore, "getMember").throws(new Error("error"));

      const args = { nickname: "memberId", activityUrl: "activity-url", resourcename: "Einzelzimmer" };
      try {
        await waitinglistService.allowRegistrationForWaitinglistEntry(args);
        expect(true).to.be(false);
      } catch (e) {
        expect(mailNotification, "Notification was not sent").to.be(undefined);
        expect(e, "Error").to.exist();
      }
    });
  });
});
