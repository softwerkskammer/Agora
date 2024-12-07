"use strict";

const request = require("supertest");
const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const createApp = require("../../testutil/testHelper")("activities").createApp;

const fieldHelpers = require("../../lib/commons/fieldHelpers");
const activitystore = require("../../lib/activities/activitystore");
const groupstore = require("../../lib/groups/groupstore");
const Activity = require("../../lib/activities/activity");
const Member = require("../../lib/members/member");
const Group = require("../../lib/groups/group");

const activitiesService = require("../../lib/activities/activitiesService");
const groupsService = require("../../lib/groups/groupsService");
const memberstore = require("../../lib/members/memberstore");

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
const member3 = new Member({
  id: "memberId3",
  nickname: "participant3",
  email: "nick3@b.c",
  firstname: "Firstname3",
  lastname: "Lastname3",
});
const member4 = new Member({
  id: "memberId4",
  nickname: "participant4",
  email: "nick4@b.c",
  firstname: "Firstname4",
  lastname: "Lastname4",
});

const group = new Group({ id: "groupname", longName: "Buxtehude" });

const activityWithParticipants = new Activity({
  title: "Interesting Activity",
  description: "description2",
  assignedGroup: "groupname",
  location: "location2",
  direction: "direction2",
  startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.01.2013").toJSDate(),
  url: "urlForInteresting",
  resources: {
    Veranstaltung: {
      _registeredMembers: [{ memberId: "memberId1" }, { memberId: "memberId2" }],
      _registrationOpen: true,
    },
  },
});
activityWithParticipants.participants = [member1, member2];
activityWithParticipants.colorRGB = "#123456";
activityWithParticipants.group = new Group({ id: "group", longName: "The name of the assigned Group" });

const activityWithEditors = new Activity({
  title: "Activity with Editors",
  description: "description5",
  assignedGroup: "groupname5",
  location: "location5",
  direction: "direction5",
  startDate: fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.01.2013").toJSDate(),
  url: "urlForEditors",
  owner: "memberId4",
  editorIds: ["memberId1", "memberId3"],
  resources: {
    default: {
      _registeredMembers: [
        { memberId: "memberId1" },
        { memberId: "memberId2" },
        { memberId: "memberId3" },
        { memberId: "memberId4" },
      ],
      _registrationOpen: true,
    },
  },
});
activityWithEditors.participants = [member1, member2, member3, member4];
activityWithEditors.colorRGB = "#123456";
activityWithEditors.group = new Group({ id: "group", longName: "The name of the group with editors" });
activityWithEditors.ownerNickname = "participant4";

describe("Activity application", () => {
  let emptyActivity;

  beforeEach(() => {
    emptyActivity = new Activity({
      title: "Title of the Activity",
      url: "urlOfTheActivity",
      assignedGroup: "groupname",
      owner: "ownerId",
    });
    sinon.stub(activitystore, "upcomingActivities").returns([emptyActivity]);
    sinon.stub(activitiesService, "getActivitiesForDisplay").returns([emptyActivity]);
    sinon.stub(memberstore, "getMembersForIds").callsFake((ids) => {
      return ids.map((id) =>
        id === "memberId1"
          ? member1
          : id === "memberId2"
            ? member2
            : id === "memberId3"
              ? member3
              : id === "memberId4"
                ? member4
                : undefined,
      );
    });

    function activityToReturnFor(url) {
      if (url === "urlOfTheActivity") {
        return emptyActivity;
      }
      if (url === "urlForInteresting") {
        return activityWithParticipants;
      }
      if (url === "urlForEditors") {
        return activityWithEditors;
      }
      return null;
    }

    sinon.stub(activitiesService, "getActivityWithGroupAndParticipantsWithAvatars").callsFake((url) => {
      return activityToReturnFor(url);
    });
    sinon.stub(activitystore, "getActivity").callsFake((url) => {
      return activityToReturnFor(url);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it("shows enriched activities when in detail", (done) => {
    emptyActivity.group = group;
    emptyActivity.participants = [member1, member2];
    emptyActivity.ownerNickname = "owner";

    request(createApp({ member: member1 }))
      .get("/" + "urlOfTheActivity")
      .expect(200)
      .expect(/<h2>Title of the Activity/)
      .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./, (err) => {
        done(err);
      });
  });

  it('shows the list of activities with "webcal:" link', (done) => {
    emptyActivity.colorRGB = "#123456";
    emptyActivity.group = group;
    emptyActivity.state.startDate = fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.01.2013").toJSDate();
    request(createApp())
      .get("/")
      .expect(200)
      .expect(/Aktivitäten/)
      .expect(/\/activities\/urlOfTheActivity"/)
      .expect(/href="webcal:\/\//)
      .expect(/Title of the Activity/)
      .expect(/1\. Januar 2013/)
      .expect(/background-color: #123456/)
      .expect(/href="\/groups\/groupname"/)
      .expect(/Buxtehude/, done);
  });

  it("shows the details of an activity without participants", (done) => {
    emptyActivity.participants = [];
    emptyActivity.state.startDate = fieldHelpers.parseToDateTimeUsingDefaultTimezone("01.01.2013").toJSDate();
    emptyActivity.state.direction = "direction1";
    emptyActivity.state.location = "location1";
    emptyActivity.state.description = "description1";
    request(createApp({ member: member1 }))
      .get("/" + "urlOfTheActivity")
      .expect(200)
      .expect(/<small>1\. Januar 2013/)
      .expect(/<h2>Title of the Activity/)
      .expect(/description1/)
      .expect(/location1/)
      .expect(/direction1/)
      .expect(/http:\/\/openstreetmap.org/)
      .expect(/Bislang gibt es keine Teilnahmezusagen\./, (err, res) => {
        expect(res.text).to.not.contain("Angelegt von");
        done(err);
      });
  });

  it("shows the details of an activity with Owner", (done) => {
    emptyActivity.group = group;
    emptyActivity.participants = [];
    emptyActivity.ownerNickname = "owner";
    request(createApp({ member: member1 }))
      .get("/" + "urlOfTheActivity")
      .expect(200)
      .expect(/Angelegt von/)
      .expect(/owner/, (err) => {
        done(err);
      });
  });

  it("shows the details of an activity with participants", (done) => {
    request(createApp("guest"))
      .get("/" + "urlForInteresting")
      .expect(200)
      .expect(/<small>1\. Januar 2013/)
      .expect(/<h2>Interesting Activity/)
      .expect(/description2/)
      .expect(/location2/)
      .expect(/direction2/)
      .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./, done);
  });

  describe("- when registration is open -", () => {
    it("shows the registration button for an activity with participants when a user is logged in who is not participant", (done) => {
      request(createApp({ member: member3 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/action="subscribe"/)
        .expect(/input type="hidden" name="url" value="urlForInteresting"/)
        .expect(/class="btn btn-primary" type="submit">Ich bin dabei!/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it("shows the registration button for an activity with participants when a user is logged in who already is participant", (done) => {
      request(createApp({ member: member1 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/action="unsubscribe"/)
        .expect(/input type="hidden" name="url" value="urlForInteresting"/)
        .expect(/class="btn btn-light" type="submit">Ich kann doch nicht/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });
  });

  describe("- when registration is not open -", () => {
    /* eslint no-underscore-dangle: 0 */
    it("shows the registration button for an activity with participants when a user is logged in who is not participant", (done) => {
      activityWithParticipants.state.resources.Veranstaltung._registrationOpen = false;

      request(createApp({ member: member3 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it("shows that registration is not possible if registrationClosed and no limit set", (done) => {
      activityWithParticipants.state.resources.Veranstaltung._registrationOpen = false;

      request(createApp({ member: member3 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Anmeldung ist zur Zeit nicht möglich\./, done);
    });

    it('shows that registration is somewhere else if registrationClosed and limit is "0"', (done) => {
      activityWithParticipants.state.resources.Veranstaltung._registrationOpen = false;
      activityWithParticipants.state.resources.Veranstaltung._limit = 0;

      request(createApp({ member: member3 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Anmeldung ist nicht über die Softwerkskammer möglich\./, done);
    });

    it("shows that the event is full if registrationClosed and some limit set", (done) => {
      activityWithParticipants.state.resources.Veranstaltung._registrationOpen = false;
      activityWithParticipants.state.resources.Veranstaltung._limit = 1;

      request(createApp({ member: member3 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Alle Plätze sind belegt\./, done);
    });

    it("shows the link to the waitinglist if registrationClosed and some limit set and waitinglist is enabled", (done) => {
      activityWithParticipants.state.resources.Veranstaltung._registrationOpen = false;
      activityWithParticipants.state.resources.Veranstaltung._limit = 1;
      activityWithParticipants.state.resources.Veranstaltung._waitinglist = [];

      request(createApp({ member: member3 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Auf die Warteliste/, done);
    });

    it("allows to leave the waitinglist if member is on waitinglist", (done) => {
      activityWithParticipants.state.resources.Veranstaltung._registrationOpen = false;
      activityWithParticipants.state.resources.Veranstaltung._limit = 1;
      activityWithParticipants.state.resources.Veranstaltung._waitinglist = [
        {
          _memberId: "memberId3",
        },
      ];

      request(createApp({ member: member3 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Warteliste verlassen/, done);
    });

    it("shows the subscription link if waitinglist participant is entitled to subscribe", (done) => {
      activityWithParticipants.state.resources.Veranstaltung._registrationOpen = false;
      activityWithParticipants.state.resources.Veranstaltung._limit = 1;
      activityWithParticipants.state.resources.Veranstaltung._waitinglist = [
        {
          _memberId: "memberId3",
          _registrationValidUntil: new Date(Date.now() + 86400000).toISOString(), // 1 day
        },
      ];

      request(createApp({ member: member3 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Ich bin dabei!/, done);
    });

    it("shows the deregistration button for an activity with participants when a user is logged in who already is participant", (done) => {
      activityWithParticipants.state.resources.Veranstaltung._registrationOpen = false;

      request(createApp({ member: member1 }))
        .get("/" + "urlForInteresting")
        .expect(200)
        .expect(/Bislang haben 2 Mitglieder ihre Teilnahme zugesagt\./)
        .expect(/action="unsubscribe"/)
        .expect(/input type="hidden" name="url" value="urlForInteresting"/)
        .expect(/class="btn btn-light" type="submit">Ich kann doch nicht/)
        .expect(/participant1/)
        .expect(/participant2/, done);
    });

    it("shows the number of participants if the total limit is greater than 0", (done) => {
      emptyActivity.participants = [];
      emptyActivity.state.resources.Veranstaltung = { _registrationOpen: false, _limit: 1 };

      request(createApp({ member: member3 }))
        .get("/" + "urlOfTheActivity")
        .expect(200)
        .expect(/Bislang gibt es keine Teilnahmezusagen\./, done);
    });

    it("does not show the number of participants if the total limit is 0", (done) => {
      emptyActivity.participants = [];
      emptyActivity.state.resources.Veranstaltung = { _registrationOpen: false, _limit: 0 };

      request(createApp({ member: member3 }))
        .get("/" + "urlOfTheActivity")
        .expect(200)
        .expect((res) => {
          expect(res.text).to.not.contain("Bislang gibt es keine Teilnahmezusagen.");
        })
        .end(done);
    });
  });

  it("upcoming activities are exposed as iCalendar", (done) => {
    emptyActivity.state.location = "location1";
    emptyActivity.state.description = "description1";

    request(createApp())
      .get("/ical")
      .expect(200)
      .expect("Content-Type", /text\/calendar/)
      .expect("Content-Disposition", /inline; filename=events\.ics/)
      .expect(/BEGIN:VCALENDAR/)
      .expect(/SUMMARY:Title of the Activity/)
      .end(done);
  });

  it("activity is exposed as iCalendar", (done) => {
    emptyActivity.state.location = "location1";
    emptyActivity.state.description = "description1";

    request(createApp())
      .get("/ical/" + "urlOfTheActivity")
      .expect(200)
      .expect("Content-Type", /text\/calendar/)
      .expect("Content-Disposition", /inline; filename=urlOfTheActivity\.ics/)
      .expect(/BEGIN:VCALENDAR/)
      .expect(/SUMMARY:Title of the Activity/)
      .end(done);
  });

  it("shows a 404 if the id cannot be found in the store for the detail page", (done) => {
    request(createApp())
      .get("/" + emptyActivity.url() + "4711")
      .expect(404, done);
  });

  it("allows to create a new activity", (done) => {
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([]);

    // in the test setup anybody can create an activity because the middleware is not plugged in
    request(createApp({ member: member1 }))
      .get("/new")
      .expect(200)
      .expect(/activities/, done);
  });

  it("allows the owner to edit an activity", (done) => {
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([]);

    request(createApp({ id: "ownerId" }))
      .get("/edit/urlOfTheActivity")
      .expect(200)
      .expect(/activities/, done);
  });

  it("disallows a member to edit another user's activity", (done) => {
    request(createApp({ id: "owner1" }))
      .get("/edit/urlOfTheActivity")
      .expect(302)
      .expect("location", /activities\/urlOfTheActivity/, done);
  });

  it("disallows a guest to edit any user's activity", (done) => {
    request(createApp())
      .get("/edit/urlOfTheActivity")
      .expect(302)
      .expect("location", /activities\/urlOfTheActivity/, done);
  });

  it("offers the owner only his groups to choose from", (done) => {
    const groupA = new Group({ id: "groupA", longName: "groupA", type: "Themengruppe" });
    const groupB = new Group({ id: "groupB", longName: "groupB", type: "Themengruppe" });
    const groupC = new Group({ id: "groupC", longName: "groupC", type: "Themengruppe" });
    sinon.stub(groupstore, "allGroups").returns([groupA, groupB, groupC]);
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([groupA, groupB]);

    request(createApp({ id: "owner" }))
      .get("/new")
      .expect(200)
      .expect(/groupA/)
      .expect(/groupB/)
      .end((err, res) => {
        expect(res.text).to.not.contain("groupC");
        done(err);
      });
  });

  it("offers a superuser all groups to choose from", (done) => {
    const groupA = new Group({ id: "groupA", longName: "groupA" });
    const groupB = new Group({ id: "groupB", longName: "groupB" });
    const groupC = new Group({ id: "groupC", longName: "groupC" });
    sinon.stub(groupstore, "allGroups").returns([groupA, groupB, groupC]);

    request(createApp({ id: "superuserID" }))
      .get("/new")
      .expect(200)
      .expect(/groupA/)
      .expect(/groupB/)
      .expect(/groupC/)
      .end(done);
  });

  it("shows a superuser all groups in the order of appearance, no matter whether they are regional or thematic groups", (done) => {
    const groupA = new Group({ id: "groupA", longName: "groupA", type: "Themengruppe" });
    const groupB = new Group({ id: "groupB", longName: "groupB", type: "Themengruppe" });
    const groupC = new Group({ id: "groupC", longName: "groupC", type: "Regionalgruppe" });
    sinon.stub(groupstore, "allGroups").returns([groupA, groupB, groupC]);

    request(createApp({ id: "superuserID" }))
      .get("/new")
      .expect(200)
      .end((err, res) => {
        expect(res.text).to.contain("groupA");
        expect(res.text.indexOf("groupA")).to.be.below(res.text.indexOf("groupB"));
        expect(res.text.indexOf("groupB")).to.be.below(res.text.indexOf("groupC"));
        done(err);
      });
  });

  it("shows regional groups first on activity creation for regular users", (done) => {
    const groupA = new Group({ id: "groupA", longName: "groupA", type: "Themengruppe" });
    const groupB = new Group({ id: "groupB", longName: "groupB", type: "Themengruppe" });
    const groupC = new Group({ id: "groupC", longName: "groupC", type: "Regionalgruppe" });
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([groupA, groupB, groupC]);

    request(createApp({ id: "owner" }))
      .get("/new")
      .expect(200)
      .end((err, res) => {
        expect(res.text).to.contain("groupC");
        expect(res.text.indexOf("groupC")).to.be.below(res.text.indexOf("groupA"));
        expect(res.text.indexOf("groupA")).to.be.below(res.text.indexOf("groupB"));
        done(err);
      });
  });

  it("shows regional groups first on activity editing for regular users", (done) => {
    const groupA = new Group({ id: "groupA", longName: "groupA", type: "Themengruppe" });
    const groupB = new Group({ id: "groupB", longName: "groupB", type: "Themengruppe" });
    const groupC = new Group({ id: "groupC", longName: "groupC", type: "Regionalgruppe" });
    sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([groupA, groupB, groupC]);

    request(createApp({ id: "ownerId" }))
      .get("/edit/urlOfTheActivity")
      .expect(200)
      .end((err, res) => {
        expect(res.text).to.contain("groupC");
        expect(res.text.indexOf("groupC")).to.be.below(res.text.indexOf("groupA"));
        expect(res.text.indexOf("groupA")).to.be.below(res.text.indexOf("groupB"));
        done(err);
      });
  });

  it("shows no group name if no groups are available", (done) => {
    emptyActivity.participants = [];
    request(createApp("guest"))
      .get("/urlOfTheActivity")
      .expect(200)
      .end((err, res) => {
        expect(res.text).to.not.contain("Veranstaltet von der Gruppe");
        done(err);
      });
  });

  it("shows the name of the assigned group if the group exists", (done) => {
    emptyActivity.group = group;
    emptyActivity.participants = [];
    request(createApp("guest"))
      .get("/urlOfTheActivity")
      .expect(200)
      .expect(/Veranstaltet von der Gruppe&nbsp;<a href="\/groups\/groupname">Buxtehude<\/a>/, done);
  });

  it("shows all activities that take place at the day of the global code retreat", (done) => {
    emptyActivity.group = group;
    request(createApp())
      .get("/gdcr")
      .expect(200)
      .expect(/1 Coderetreats/, done);
  });

  describe("url check", () => {
    it("returns false for checkurl when the url already exists", (done) => {
      request(createApp()).get("/checkurl?url=urlOfTheActivity&previousUrl=x").expect(200).expect(/false/, done);
    });

    it("returns true for checkurl when the url does not exist", (done) => {
      request(createApp()).get("/checkurl?url=UnknownURL&previousUrl=x").expect(200).expect(/true/, done);
    });
  });

  describe("- when editors are being utilized -", () => {
    it("does not show the names of the editors for a guest visitor", (done) => {
      request(createApp())
        .get("/urlForEditors")
        .expect(200)
        .end((err, res) => {
          expect(res.text).to.not.contain("Editoren:");
          expect(res.text).to.not.contain("participant1");
          expect(res.text).to.not.contain("participant3");
          done(err);
        });
    });

    it("shows the names of the editors for a registered member", (done) => {
      request(createApp({ member: member1 }))
        .get("/urlForEditors")
        .expect(200)
        .expect(
          /Editoren:&nbsp;<a href="\/members\/participant1">participant1<\/a>&nbsp;<a href="\/members\/participant3">participant3<\/a>\s*<\/p>/,
          done,
        );
    });

    it("allows editing by the owner, displays the current editors and the possible editors (all participants but not the owner)", (done) => {
      sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([]);

      request(createApp({ member: member4 }))
        .get("/edit/urlForEditors")
        .expect(200)
        .expect(/<option selected="selected">Firstname1 Lastname1 \(participant1\)/)
        .expect(/<option>Firstname2 Lastname2 \(participant2\)/)
        .expect(/<option selected="selected">Firstname3 Lastname3 \(participant3\)/)
        .end(done);
    });

    it("allows editing by an editor, displays the current editors and the possible editors (all participants but not the owner)", (done) => {
      sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([]);

      request(createApp({ member: member1 }))
        .get("/edit/urlForEditors")
        .expect(200)
        .expect(/<option selected="selected">Firstname1 Lastname1 \(participant1\)/)
        .expect(/<option>Firstname2 Lastname2 \(participant2\)/)
        .expect(/<option selected="selected">Firstname3 Lastname3 \(participant3\)/)
        .end(done);
    });

    it("always shows the already assigned group for selection even if it is not returned for the current user", (done) => {
      sinon.stub(groupsService, "getSubscribedGroupsForMember").returns([]);

      request(createApp({ member: member1 }))
        .get("/edit/urlForEditors")
        .expect(200)
        .expect(/<option value="group">The name of the group with editors/)
        .end(done);
    });
  });

  describe("User subscription", () => {
    it("adds the current user to the list of participants, captures a success message in the session and redirects to the activity on subscribe", (done) => {
      sinon.stub(activitiesService, "addVisitorTo").returns([]);

      let session;
      const sessionCaptureCallback = (s) => {
        session = s;
      };

      request(createApp({ member: member1, sessionCaptureCallback }))
        .post("/subscribe")
        .type("form")
        .send({ url: "myActivity" })
        .expect(302)
        .expect("Found. Redirecting to /activities/myActivity")
        .end(function (err) {
          expect(session.statusmessage.type).to.be("alert-success");
          expect(session.statusmessage.title).to.be("message.title.save_successful");
          expect(session.statusmessage.text).to.be("message.content.activities.participation_added");
          done(err);
        });
    });

    it("captures the service status title and status message in the session and redirects to the activity", (done) => {
      sinon.stub(activitiesService, "addVisitorTo").returns(["Status Title", "Status Text"]);

      let session;
      const sessionCaptureCallback = (s) => {
        session = s;
      };

      request(createApp({ member: member1, sessionCaptureCallback }))
        .post("/subscribe")
        .type("form")
        .send({ url: "myActivity" })
        .expect(302)
        .expect("Found. Redirecting to /activities/myActivity")
        .end(function (err) {
          expect(session.statusmessage.type).to.be("alert-danger");
          expect(session.statusmessage.title).to.be("Status Title");
          expect(session.statusmessage.text).to.be("Status Text");
          done(err);
        });
    });

    it("displays a 500 with the error message if there is an error from the service", (done) => {
      sinon.stub(activitiesService, "addVisitorTo").throws(new Error("Oops..."));

      request(createApp({ member: member1 }))
        .post("/subscribe")
        .type("form")
        .send({ url: "myActivity" })
        .expect(500)
        .expect(/Error: Oops.../)
        .end(done);
    });

    it("displays a 404 when trying to subscribe to an activity via GET request", (done) => {
      request(createApp({ member: member1 }))
        .get("/subscribe")
        .expect(404)
        .end(done);
    });
  });

  describe("User unsubscription", () => {
    it("removes the current user from the list of participants, captures a success message in the session and redirects to the activity on subscribe", (done) => {
      sinon.stub(activitiesService, "removeVisitorFrom").returns([]);

      let session;
      const sessionCaptureCallback = (s) => {
        session = s;
      };

      request(createApp({ member: member1, sessionCaptureCallback }))
        .post("/unsubscribe")
        .type("form")
        .send({ url: "myActivity" })
        .expect(302)
        .expect("Found. Redirecting to /activities/myActivity")
        .end(function (err) {
          expect(session.statusmessage.type).to.be("alert-success");
          expect(session.statusmessage.title).to.be("message.title.save_successful");
          expect(session.statusmessage.text).to.be("message.content.activities.participation_removed");
          done(err);
        });
    });

    it("captures the unsubscribe service status title and status message in the session and redirects to the activity", (done) => {
      sinon.stub(activitiesService, "removeVisitorFrom").returns(["Status Title", "Status Text"]);

      let session;
      const sessionCaptureCallback = (s) => {
        session = s;
      };

      request(createApp({ member: member1, sessionCaptureCallback }))
        .post("/unsubscribe")
        .type("form")
        .send({ url: "myActivity" })
        .expect(302)
        .expect("Found. Redirecting to /activities/myActivity")
        .end(function (err) {
          expect(session.statusmessage.type).to.be("alert-danger");
          expect(session.statusmessage.title).to.be("Status Title");
          expect(session.statusmessage.text).to.be("Status Text");
          done(err);
        });
    });

    it("displays a 500 with the error message if there is an error from the service", (done) => {
      sinon.stub(activitiesService, "removeVisitorFrom").throws(new Error("Oops..."));

      request(createApp({ member: member1 }))
        .post("/unsubscribe")
        .type("form")
        .send({ url: "myActivity" })
        .expect(500)
        .expect(/Error: Oops.../)
        .end(done);
    });
  });
});
